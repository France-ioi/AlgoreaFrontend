import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test.describe.configure({ mode: 'serial' });

test.describe('floating save visibility on parameters load', () => {
  test('single-language item: no save bar on load (item supports one language)', async ({ page, createItem, itemContentPage }) => {
    if (!createItem) throw new Error('The item is not created');

    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });
    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();
    await expect.soft(page.getByTestId('lang-panel-en')).toBeVisible();
    await expect.soft(saveBtnLocator).not.toBeVisible();
    await expect.soft(cancelBtnLocator).not.toBeVisible();
  });

  test('single-language item: save bar appears after editing the title', async ({ page, createItem, itemContentPage }) => {
    if (!createItem) throw new Error('The item is not created');

    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });

    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(saveBtnLocator).not.toBeVisible();

    await page.getByTestId('lang-panel-en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Edited title');

    await expect.soft(saveBtnLocator).toBeVisible();
    await expect.soft(cancelBtnLocator).toBeVisible();
  });
});
