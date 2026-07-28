import { test, expect } from 'e2e/common/fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

/**
 * Regression for ALGOREA-FG: after breadcrumbs+start-result-path both fail, the app strips
 * the path (`hasRedirected = true`). Clicking the Content tab restores the remembered route
 * with the same path; the app must strip the path again without throwing
 * "Too many redirections (unexpected)".
 *
 * Detection uses an Error constructor hook because AlgErrorHandler sends the throw to Sentry
 * without console.error / pageerror.
 */

const inaccessibleItemId = '4070242204646448376';
const inaccessibleItemPathIds = [ '4702', '7528142386663912287', '944619266928306927' ] as const;
const inaccessibleItemPath = inaccessibleItemPathIds.join(',');
const inaccessibleItemUrl = `/a/${inaccessibleItemId};p=${inaccessibleItemPath};a=0`;
const breadcrumbsPath = [ ...inaccessibleItemPathIds, inaccessibleItemId ].join('/');

test('does not throw Too many redirections when Content restores a failed item path', async ({ page, leftMenu }) => {
  // AlgErrorHandler does not console.error; detect the throw by wrapping Error.
  await page.addInitScript(`(() => {
    window.__tooManyRedirections = false;
    const OriginalError = window.Error;
    window.Error = function (message) {
      const error = new OriginalError(message);
      if (String(message ?? '').includes('Too many redirections')) {
        window.__tooManyRedirections = true;
      }
      return error;
    };
    window.Error.prototype = OriginalError.prototype;
  })();`);

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
  const threwTooManyRedirections = await page.evaluate(
    () => (window as unknown as { __tooManyRedirections?: boolean }).__tooManyRedirections === true
  );
  expect(threwTooManyRedirections).toBe(false);
});
