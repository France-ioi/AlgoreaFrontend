import { test, expect } from 'e2e/common/fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

test('chapter-children grid recovers from a token-expiration cascade', async ({ page }) => {
  await initAsUsualUser(page);
  // Same Grid-layout chapter URL as `e2e/items/chapter-children.spec.ts`. If that fixture URL is
  // updated, update it here too.
  await page.goto('/a/9151590357867554022;p=7528142386663912287,6621899821435600308;a=0');

  const firstChildLink = page.locator('alg-chapter-children > div > div:first-child > a');
  await expect(firstChildLink).toBeVisible();

  // Reproduce the wake-from-sleep cascade: invalidate the current token and let the app silently
  // create a new temp user. Before the fix, this would leave `alg-chapter-children` stuck on its
  // error state because the outer `mapToFetchState` subscription had completed on the 401.
  await page.evaluate(() => {
    (window as unknown as { algoreaSimulateTokenExpiration: () => void }).algoreaSimulateTokenExpiration();
  });

  await expect(page.locator('alg-chapter-children alg-error')).toBeHidden({ timeout: 10_000 });
  await expect(firstChildLink).toBeVisible();
});
