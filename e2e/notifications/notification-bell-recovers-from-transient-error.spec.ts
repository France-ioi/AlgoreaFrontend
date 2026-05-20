import { test, expect } from 'e2e/common/fixture';
import { mockConfig } from 'e2e/assets/mock-config';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

// Faux SLS host used to intercept the notifications endpoint without hitting any real service.
const slsApiUrl = 'https://mock-sls.local';

const enableNotificationsConfig = (): unknown => ({
  ...mockConfig,
  slsApiUrl,
  featureFlags: {
    ...mockConfig.featureFlags,
    enableNotifications: true,
  },
});

test('notification bell recovers from a transient 503', async ({ page }) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${JSON.stringify(enableNotificationsConfig())}`,
    });
  });

  // The notification feature subscribes to the SLS identity token before fetching notifications.
  // Stub it so the test does not depend on the real auth backend supporting SLS identity tokens.
  await page.route(`${apiUrl}/auth/identity-token`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'ok',
        data: { identity_token: 'mock-sls-token', expires_in: 3600 },
      }),
    });
  });

  let attempt = 0;
  await page.route(`${slsApiUrl}/notifications**`, async route => {
    attempt++;
    if (attempt === 1) {
      await route.fulfill({ status: 503, body: '' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notifications: [] }),
    });
  });

  await initAsUsualUser(page);
  await page.goto('/');

  const badge = page.locator('alg-notification-bell .badge');
  // Wait until the bell finishes loading (the badge text becomes a number, not '?' or '!').
  await expect(badge).toHaveText('0');
  await expect(badge).not.toHaveClass(/error/);
  expect(attempt).toBeGreaterThanOrEqual(2);
});
