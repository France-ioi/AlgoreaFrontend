import { test as base, expect } from './fixture';

interface ItemData {
  itemName: string,
  itemId: string,
}

interface CreateGroupFixtures {
  /** Creation type label passed to alg-add-content (exact match). Default: Chapter. */
  itemCreationType: string,
  createItem: ItemData | undefined,
  deleteItem: ItemData | undefined,
}

export const rootItemId = '1751831682141956756';

export const test = base.extend<CreateGroupFixtures>({
  itemCreationType: [ 'Chapter', { option: true }],
  createItem: async ({ itemContentPage, itemCreationType }, use) => {
    const itemName = `E2E_Item_${ Date.now() }`;
    await Promise.all([
      itemContentPage.goto(`a/${rootItemId};p=;a=0/edit-children`),
      itemContentPage.waitForItemResponse(rootItemId),
    ]);
    await itemContentPage.waitForChildrenResponse(rootItemId, 'attempt_id=0&show_invisible_items=1');
    await itemContentPage.checksIsItemChildrenEditListVisible();
    await itemContentPage.checksIsAddContentVisible();
    const itemId = await itemContentPage.createChildItem(itemName, itemCreationType);
    if (itemId) await use({ itemName, itemId });
  },
  deleteItem: async ({ page, itemContentPage, createItem }, use) => {
    if (!createItem) return;
    // Chapter deletion needs a selected attempt to check emptiness. Explicit-entry items have no
    // attempt until started, so resolve/create one before opening Parameters.
    await Promise.all([
      itemContentPage.goto(`a/${createItem.itemId};p=${rootItemId};pa=0`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    const startBtn = page.getByRole('button', { name: 'Start this activity' });
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        startBtn.click(),
        page.waitForResponse(response =>
          response.request().method() === 'POST' &&
          /\/items\/[\d/]+\/attempts\?/.test(response.url()) &&
          response.ok()
        ),
      ]);
    }
    await expect.poll(() => /(?:^|[;/])a=\d+/.test(page.url()), { timeout: 15000 }).toBe(true);
    await itemContentPage.openParametersTab();
    await itemContentPage.checksIsDeleteButtonVisible();
    // `deleteItem` already waits for the DELETE response, and the next assertion below
    // (`checksIsTitleVisible('E2E-generated-items')`) proves the post-deletion navigation
    // happened. We deliberately don't assert on the toast here: toasts auto-dismiss after 5s
    // and asserting on them races with that timer on slow CI runners.
    await itemContentPage.deleteItem();
    await itemContentPage.checksIsTitleVisible('E2E-generated-items');
    await itemContentPage.goto(`a/${createItem.itemId};p=${rootItemId};pa=0`);
    await itemContentPage.checksIsAllowToViewMessageNotVisible();
    await use({ itemName: createItem.itemName, itemId: createItem.itemId });
  },
});

export { expect, Page } from '@playwright/test';
