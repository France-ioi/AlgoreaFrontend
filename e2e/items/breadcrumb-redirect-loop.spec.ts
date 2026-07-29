import { test, expect } from 'e2e/common/fixture';
import { mockConfig } from 'e2e/assets/mock-config';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import {
  hasThrownTooManyRedirections,
  installTooManyRedirectionsDetector,
} from 'e2e/helpers/too-many-redirections';

/**
 * Regression for ALGOREA-FG: after breadcrumbs+start-result-path both fail, the app strips
 * the path. Clicking the Content tab restores the remembered route with the same path; the app
 * must strip the path again without throwing "Too many redirections (unexpected)".
 *
 * A second scenario covers switching left-menu tabs to another inaccessible item while the
 * previous item's path-from-root recovery is still in flight (guard must be scoped per item id).
 */

const inaccessibleItemId = '4070242204646448376';
const inaccessibleItemPathIds = [ '4702', '7528142386663912287', '944619266928306927' ] as const;
const inaccessibleItemPath = inaccessibleItemPathIds.join(',');
const inaccessibleItemUrl = `/a/${inaccessibleItemId};p=${inaccessibleItemPath};a=0`;
const breadcrumbsPath = [ ...inaccessibleItemPathIds, inaccessibleItemId ].join('/');

const tabAItemId = '7523720120450464843';
const tabBItemId = '4102';
const tabAPathIds = [ '4702', '7528142386663912287' ] as const;
const tabBPathIds = [ '4702' ] as const;

const twoInaccessibleActivitiesTabsConfig = {
  leftMenuTabs: [
    { type: 'activities', showTo: 'all', content: { id: '4702', path: [] } },
    {
      type: 'activities',
      showTo: 'all',
      content: { id: tabAItemId, path: [ ...tabAPathIds ] },
      caption: { default: 'TabA' },
    },
    {
      type: 'activities',
      showTo: 'all',
      content: { id: tabBItemId, path: [ ...tabBPathIds ] },
      caption: { default: 'TabB' },
    },
  ],
};

test('does not throw Too many redirections when Content restores a failed item path', async ({ page, leftMenu }) => {
  await installTooManyRedirectionsDetector(page);

  await Promise.all([
    page.waitForResponse(response =>
      response.url().startsWith(`${apiUrl}/items/${breadcrumbsPath}/breadcrumbs`) && response.status() === 403
    ),
    page.waitForResponse(response =>
      response.url().startsWith(`${apiUrl}/items/${breadcrumbsPath}/start-result-path`) && response.status() === 403
    ),
    page.goto(inaccessibleItemUrl),
  ]);

  await expect(page).toHaveURL(new RegExp(`/a/${inaccessibleItemId};a=0(?:$|/|\\?)`));
  await expect(page.getByRole('heading', { name: 'Restricted Content' })).toBeVisible();

  await leftMenu.clickTab('Content');

  // Content restores the remembered path; the app must strip it again without throwing.
  await expect(page).toHaveURL(new RegExp(`/a/${inaccessibleItemId};a=0(?:$|/|\\?)`));
  await expect(page.getByRole('heading', { name: 'Restricted Content' })).toBeVisible();
  expect(await hasThrownTooManyRedirections(page)).toBe(false);
});

test('does not throw Too many redirections when switching tabs while path recovery is in flight', async ({
  page,
  leftMenu,
}) => {
  await initAsTesterUser(page);
  await installTooManyRedirectionsDetector(page);

  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify({ ...mockConfig, ...twoInaccessibleActivitiesTabsConfig }) }`,
    });
  });

  const tabABreadcrumbsPath = [ ...tabAPathIds, tabAItemId ].join('/');
  const tabBBreadcrumbsPath = [ ...tabBPathIds, tabBItemId ].join('/');

  await page.route(`**/items/${tabABreadcrumbsPath}/breadcrumbs*`, route => route.fulfill({ status: 403 }));
  await page.route(`**/items/${tabBBreadcrumbsPath}/breadcrumbs*`, route => route.fulfill({ status: 403 }));
  await page.route('**/start-result-path', route => route.fulfill({ status: 403 }));

  // Hold TabA path-from-root so recovery stays in flight (matches the Sentry cross-item race). 60s is safe:
  // assertions finish well before it settles, and Playwright tears down the context at test end.
  await page.route(`**/items/${tabAItemId}/path-from-root*`, async route => {
    await new Promise(resolve => setTimeout(resolve, 60_000));
    await route.abort();
  });
  // Abort TabB path-from-root so a late heal cannot race the path-strip assertions.
  await page.route(`**/items/${tabBItemId}/path-from-root*`, route => route.abort());

  await page.goto('/a/home;pa=0');

  await leftMenu.clickTab('TabA');
  await expect(page).toHaveURL(new RegExp(`/a/${tabAItemId}`));
  await expect(page).not.toHaveURL(/;p=/);

  await leftMenu.clickTab('TabB');
  await expect(page).toHaveURL(new RegExp(`/a/${tabBItemId}`));
  await expect(page).not.toHaveURL(/;p=/);
  expect(await hasThrownTooManyRedirections(page)).toBe(false);
});
