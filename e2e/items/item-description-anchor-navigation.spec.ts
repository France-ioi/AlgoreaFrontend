import { test, expect, Page } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

/**
 * Anchor navigation behavior of `alg-description-iframe` exercised on a real item description
 * that contains every supported anchor variant: a hash anchor, a `data-item-id` child link, an
 * external `<a href="https://…">`, and an external `<a data-url="https://…">`. The page lives at
 * a fixed URL on the dev backend and is curated for these tests.
 */
const ITEM_ID = '7709031376029357010';
const ITEM_PATH = '4702,7528142386663912287,6621899821435600308';
const ITEM_URL = `/a/${ITEM_ID};p=${ITEM_PATH};a=0`;

async function waitForDescriptionReady(page: Page): Promise<void> {
  await expect(page.locator('[data-testid=item-description] iframe')).toBeVisible();
  // The runtime helper inside the iframe posts an `alg.updateDisplay` once layout settles; that
  // sets `[style.height]` on the iframe element. Waiting on it guarantees the script ran and the
  // click handler is wired before we start dispatching clicks.
  await expect.poll(
    async () => page.locator('[data-testid=item-description] iframe').evaluate(el => el.style.height),
    { message: 'iframe height should be set by alg.updateDisplay before interacting', timeout: 10_000 },
  ).not.toBe('');
}

test.describe('description iframe — anchor navigation on a real item', () => {
  test.beforeEach(async ({ page }) => {
    await initAsTesterUser(page);
  });

  // Regression for the user-reported Firefox bug: hash anchors must not blank the iframe and
  // must not trigger a top-frame navigation. We assert the document URL is unchanged and the
  // iframe still contains the targeted anchor afterwards.
  test('hash anchor inside the description scrolls without blanking the iframe', async ({ page }) => {
    await page.goto(ITEM_URL);
    await waitForDescriptionReady(page);

    const frame = page.locator('[data-testid=item-description] iframe').contentFrame();
    const hashAnchor = frame.locator('a[href^="#"]').first();
    await expect(hashAnchor, 'description should contain at least one hash anchor').toBeVisible();
    const targetName = await hashAnchor.evaluate(a => (a as HTMLAnchorElement).getAttribute('href')!.slice(1));

    const urlBefore = page.url();
    await hashAnchor.click();

    // (a) URL did not change (no top-frame nav).
    expect(page.url()).toBe(urlBefore);
    // (b) The targeted anchor is still in the iframe — i.e. the iframe wasn't blanked.
    await expect(
      frame.locator(`[id="${targetName}"], a[name="${targetName}"]`).first(),
    ).toBeAttached();
  });

  // Child item navigation via `<a data-item-id="…" data-child>` must build the path from the
  // current item's route and skip the path-resolution roundtrip — i.e. it must NOT call
  // `/items/.../breadcrumbs-from-roots`. Calling that endpoint would mean the path-less
  // navigation flow ran instead of the optimized child path.
  test('child link navigates with a path attached and skips breadcrumbs-from-roots', async ({ page }) => {
    await page.goto(ITEM_URL);
    await waitForDescriptionReady(page);

    const frame = page.locator('[data-testid=item-description] iframe').contentFrame();
    const childLink = frame.locator('a[data-item-id][data-child]').first();
    await expect(childLink, 'description should contain at least one data-item-id+data-child link').toBeVisible();
    const childItemId = await childLink.evaluate(el => el.getAttribute('data-item-id')!);

    let breadcrumbsFromRootsCalled = false;
    page.on('request', req => {
      if (req.url().startsWith(`${apiUrl}/items/`) && req.url().includes('/breadcrumbs-from-roots')) {
        breadcrumbsFromRootsCalled = true;
      }
    });

    await childLink.click();

    // The new URL should target the child id with the parent path = current path + current id.
    await expect(page).toHaveURL(new RegExp(`/a/${childItemId};p=${ITEM_PATH},${ITEM_ID}(;|$)`));
    // The path-resolution endpoint must never have been called for this navigation.
    expect(
      breadcrumbsFromRootsCalled,
      '/breadcrumbs-from-roots must not be called when path is already known via data-child',
    ).toBe(false);
  });

  test('plain external <a href="https://…"> stays in iframe and surfaces a toast', async ({ page }) => {
    await page.goto(ITEM_URL);
    await waitForDescriptionReady(page);

    const frame = page.locator('[data-testid=item-description] iframe').contentFrame();
    // External href = http(s) link that is NOT a child link or `data-url` link.
    const externalHref = frame.locator(
      'a[href^="http"]:not([data-item-id]):not([data-url])',
    ).first();
    await expect(externalHref, 'description should contain at least one external https href').toBeVisible();
    const href = await externalHref.evaluate(el => (el as HTMLAnchorElement).getAttribute('href')!);

    const urlBefore = page.url();
    await externalHref.click();

    // The iframe must not navigate — we should still be on the original item page.
    expect(page.url()).toBe(urlBefore);
    await expect(externalHref).toBeVisible();
    // The toast carrying the URL should appear (info severity) on the parent surface.
    await expect(page.locator('alg-toast-messages .message-text')).toContainText(href);
  });

  test('<a data-url="https://…"> stays in iframe and surfaces a toast', async ({ page }) => {
    await page.goto(ITEM_URL);
    await waitForDescriptionReady(page);

    const frame = page.locator('[data-testid=item-description] iframe').contentFrame();
    const dataUrlLink = frame.locator('a[data-url]').first();
    await expect(dataUrlLink, 'description should contain at least one data-url link').toBeVisible();
    const dataUrl = await dataUrlLink.evaluate(el => el.getAttribute('data-url')!);

    const urlBefore = page.url();
    await dataUrlLink.click();

    expect(page.url()).toBe(urlBefore);
    await expect(dataUrlLink).toBeVisible();
    await expect(page.locator('alg-toast-messages .message-text')).toContainText(dataUrl);
  });
});
