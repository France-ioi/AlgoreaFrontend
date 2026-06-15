import { test, expect } from '../common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

const chapterId = '7523720120450464843';
const editChildrenUrl = `/a/${chapterId};p=7528142386663912287;a=0/edit-children`;

// Regression test: cancelling the "Confirm Navigation" modal must keep the pending children edits,
// not silently re-fetch and revert them (see PR #2229 / modernize-ng-comp-19).
test('keeps pending children edits when navigation is cancelled', async ({
  page,
  itemContentPage,
  itemChildrenEditListComponent,
  lostChangesConfirmationModal,
}) => {
  await initAsTesterUser(page);

  await Promise.all([
    itemContentPage.goto(editChildrenUrl),
    itemContentPage.waitForItemResponse(chapterId),
  ]);
  await itemContentPage.checksIsItemChildrenEditListVisible();

  const initialRowsCount = await itemChildrenEditListComponent.getRowsCount();
  expect(initialRowsCount).toBeGreaterThan(0);

  await test.step('removes a child locally', async () => {
    await itemChildrenEditListComponent.selectChildByIndex(0);
    await itemChildrenEditListComponent.removeSelected();
    await expect.poll(() => itemChildrenEditListComponent.getRowsCount()).toBe(initialRowsCount - 1);
  });

  await test.step('cancels navigation to another tab and keeps the change', async () => {
    // The "Parameters" tab triggers a new `itemData` emission; before the fix this re-fetched the
    // children and reverted the pending removal even though the navigation was cancelled.
    await page.getByRole('link', { name: 'Parameters' }).click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.cancel();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();

    // Still on the children edit tab...
    await itemContentPage.checksIsItemChildrenEditListVisible();
    // ...and the removed child must NOT have been reverted by a background re-fetch.
    await expect.poll(() => itemChildrenEditListComponent.getRowsCount()).toBe(initialRowsCount - 1);
  });
});
