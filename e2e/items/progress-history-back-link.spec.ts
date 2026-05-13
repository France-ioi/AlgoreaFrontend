import { test, expect, Page } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const observedGroupId = '4462192261130512818';
const observedUserId = '752024252804317630';
const colItemId = '6379723280369399253';

const sourceUrl = `/a/7523720120450464843;p=7528142386663912287;a=0;og=${observedGroupId}/progress/chapter`;
const userProgressUrl = `${apiUrl}/groups/${observedGroupId}/user-progress?parent_item_ids=7523720120450464843&limit=51`;
const historyLogUrl = `${apiUrl}/items/${colItemId}/log?limit=21&watched_group_id=${observedUserId}`;

async function gotoSourceProgressGrid(page: Page): Promise<void> {
  await Promise.all([
    page.goto(sourceUrl),
    page.waitForResponse(userProgressUrl),
  ]);
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
}

async function openHistoryFromCellModal(page: Page): Promise<void> {
  await page.locator('alg-group-progress-grid table tr:nth-child(2) td:nth-child(3) alg-score-ring').click({ force: true });
  await expect(page.getByText('time spent:')).toBeVisible();
  // The View answer section (above the History button) appears asynchronously when
  // currentUser$ resolves; waiting for it ensures the History link's position is stable
  // before we click it (otherwise Firefox can lose the click during the layout shift).
  // The 15s timeout is generous on purpose: under Firefox CI load, currentUser$ has been
  // observed taking >5s to emit; the default 30s expect timeout would still pass but we
  // surface a clearer failure boundary here.
  await expect(
    page.locator('alg-user-progress-details').getByRole('link', { name: 'View answer' })
  ).toBeVisible({ timeout: 15_000 });
  // Scope to alg-user-progress-details to avoid matching the chapter tabs' "History" link.
  const historyLink = page.locator('alg-user-progress-details').getByRole('link', { name: 'History' });
  await expect(historyLink).toBeVisible();
  // The CDK overlay holding the modal can reposition asynchronously, briefly detaching the
  // link from the DOM (Firefox in particular). Trigger the click via the native `el.click()`
  // to bypass Playwright's actionability/stability retries; routerLink's handler still fires.
  // Gate the navigation on both the URL change AND the (mocked) activity-log fetch — the
  // latter is the deterministic signal that `alg-item-log-view` has actually mounted on
  // the destination page, so subsequent assertions on its back-link bar don't have to
  // race a slow route-resolver/render under Firefox CI load.
  await Promise.all([
    page.waitForURL(new RegExp(`/a/${colItemId};.*og=${observedUserId}.*/progress/history`)),
    page.waitForResponse(historyLogUrl),
    historyLink.evaluate((el: HTMLAnchorElement) => el.click()),
  ]);
}

test('History button shows a back-link bar that returns to the progress grid', async ({ page }) => {
  // Walks through 4 dev-backend round-trips: chapter progress grid → cell modal → user
  // progress fetch → history page mount → activity-log fetch. Under Firefox CI load this
  // cumulative wall time can exceed the 30s default test budget even though no individual
  // assertion is hung. `slow()` triples both the test and expect timeouts (90s) so the
  // back-link bar visibility check at the end actually gets to run.
  test.slow();

  await initAsTesterUser(page);

  // Mock only the volatile activity-log endpoint (matches the convention used in
  // e2e/items/item-logs.spec.ts and e2e/groups/view-answer.spec.ts). Everything else
  // (navigation, progress grid, observation info) goes against the real dev backend.
  await page.route(historyLogUrl, route => route.fulfill({ json: [] }));

  await gotoSourceProgressGrid(page);

  // The back-link label uses the OBSERVED-GROUP name (the group whose stats grid we came
  // from), not the row's user/team name. Read it from the observation bar in the top bar
  // so the assertion stays robust if the dev backend's display name for this group changes.
  const observedGroupName = (
    await page.locator('alg-content-top-bar alg-observation-bar a.link').first().textContent()
  )?.trim() ?? '';
  expect(observedGroupName.length).toBeGreaterThan(0);

  await test.step('open the modal and click History', async () => {
    await openHistoryFromCellModal(page);
  });

  const itemLogView = page.locator('alg-item-log-view');
  const backLinkBar = itemLogView.locator('alg-back-link-bar');
  const backLinkButton = backLinkBar.locator('button');

  await test.step('back-link bar shows the correct heading and label', async () => {
    // Assert the host view first so a slow destination-page mount produces a clearer
    // failure message ("alg-item-log-view not visible") instead of being mis-attributed
    // to the back-link state never being registered.
    await expect.soft(itemLogView).toBeVisible();
    await expect.soft(backLinkBar).toBeVisible();
    // Heading reflects the user we are now observing (history page context). The bar itself
    // appears as soon as the back-link is registered, but the heading text only fills in once
    // the destination's observation info has been fetched — that fetch can be slow under load
    // (observed in Firefox CI), so give this specific assertion a longer timeout.
    await expect.soft(backLinkBar.locator('.description'))
      .toHaveText(/^You are now on the history page of user .+\.$/, { timeout: 15_000 });
    // Button label uses the previous group-page name set by the source-page initializer,
    // NOT the row's user name. This guards against regressing the bug where rowGroup.name
    // was used (label would have shown the user's login instead of the group's).
    await expect.soft(backLinkButton).toHaveText(`Return to ${observedGroupName} group stats`);
    await expect.soft(backLinkButton).not.toContainText('usr_5p020x2thuyu');
  });

  await test.step('clicking the back-link returns to the source progress table', async () => {
    await Promise.all([
      backLinkButton.click(),
      page.waitForURL(sourceUrl),
    ]);
    await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
  });
});

test('back-link bar is cleared when navigating away from the history page', async ({ page }) => {
  // See sibling test for rationale: the chapter-grid → modal → history-page round-trip
  // can outlast the 30s test budget on Firefox CI. `slow()` extends it to 90s.
  test.slow();

  await initAsTesterUser(page);
  await page.route(historyLogUrl, route => route.fulfill({ json: [] }));

  await gotoSourceProgressGrid(page);
  await openHistoryFromCellModal(page);

  const backLinkBar = page.locator('alg-item-log-view alg-back-link-bar');
  await expect(backLinkBar).toBeVisible();

  await test.step('navigate away via in-app router navigation', async () => {
    // Trigger an Angular-Router-handled popstate. This dispatches `routerNavigatedAction`
    // and lets `clearBackLinkEffect` clear the back-link state. We use `page.evaluate` +
    // `history.back()` instead of `page.goBack()` because the latter waits for a `load`
    // event that never fires for same-document SPA navigations and can hang. A `page.goto`
    // would do a hard reload, resetting the store, and would not exercise the clearing.
    await page.evaluate(() => history.back());
    await expect(page).toHaveURL(sourceUrl);
  });

  await test.step('returning to the history page does not show a stale bar', async () => {
    await page.evaluate(() => history.forward());
    await expect(page.locator('alg-item-log-view')).toBeVisible();
    await expect(page.locator('alg-item-log-view alg-back-link-bar')).toHaveCount(0);
  });
});
