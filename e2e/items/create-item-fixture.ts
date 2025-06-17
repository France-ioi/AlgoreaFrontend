import { test as base } from './fixture';

interface ItemData {
  itemName: string,
  itemId: string,
}

interface CreateGroupFixtures {
  createItem: ItemData | undefined,
  deleteItem: ItemData | undefined,
}

export const rootItemId = '1751831682141956756';

export const test = base.extend<CreateGroupFixtures>({
  createItem: async ({ itemContentPage }, use) => {
    const itemName = `E2E_Item_${ Date.now() }`;
    await Promise.all([
      itemContentPage.goto(`a/${rootItemId};p=;a=0/edit-children`),
      itemContentPage.waitForItemResponse(rootItemId),
    ]);
    await itemContentPage.waitForChildrenResponse(rootItemId, 'attempt_id=0&show_invisible_items=1');
    await itemContentPage.checksIsItemChildrenEditListVisible();
    await itemContentPage.checksIsAddContentVisible();
    const itemId = await itemContentPage.createChildItem(itemName);
    if (itemId) await use({ itemName, itemId });
  },
  deleteItem: async ({ itemContentPage, createItem }, use) => {
    if (!createItem) return;
    await Promise.all([
      itemContentPage.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await itemContentPage.checksIsDeleteButtonVisible();
    await itemContentPage.deleteItem();
    await itemContentPage.checkToastNotification(`SuccessYou have delete "${createItem.itemName}"`);
    await itemContentPage.checksIsTitleVisible('E2E-generated-items');
    await itemContentPage.goto(`a/${createItem.itemId};p=${rootItemId};pa=0`);
    await itemContentPage.checksIsAllowToViewMessageNotVisible();
    await use({ itemName: createItem.itemName, itemId: createItem.itemId });
  },
});

export { expect, Page } from '@playwright/test';
