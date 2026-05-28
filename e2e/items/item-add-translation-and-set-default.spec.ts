import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

async function openTabsAndAddFrench(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Translate' }).click();
  await page.getByTestId('lang-tab-add-fr').click();
}

/**
 * Regression: adding a new translation AND promoting it to default in the same save was failing
 * because the wrapper used to update the item record (with the new `default_language_tag`) before
 * creating the corresponding item-string — backend rejects pointing `default_language_tag` at a
 * language without a row in `items_strings`.
 */
test('checks creating a translation and setting it as default in a single save', async (
  { page, createItem, itemContentPage }
) => {
  if (!createItem) throw new Error('The item is not created');

  const frTabLocator = page.getByTestId('lang-tab-fr');
  const itemStringsTitleFrLocator = page.getByTestId('lang-panel-fr').getByTestId('item-strings-title');
  const setDefaultFrBtnLocator = page.getByTestId('lang-panel-fr').getByTestId('set-default-language-btn');
  const setDefaultEnBtnLocator = page.getByTestId('lang-panel-en').getByTestId('set-default-language-btn');
  const deleteFrBtnLocator = page.getByTestId('lang-tab-row-fr').getByTestId('remove-language-btn');

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();

  await test.step('Add a French translation, fill it, and promote it to default', async () => {
    await openTabsAndAddFrench(page);

    await expect.soft(itemStringsTitleFrLocator).toBeVisible();
    await itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox').fill('Mon titre français');

    await expect.soft(setDefaultFrBtnLocator).toBeVisible();
    await setDefaultFrBtnLocator.click();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('After save, French is the default language', async () => {
    await expect.soft(frTabLocator).toContainText('(default)');
    await page.getByTestId('lang-tab-en').click();
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
    await expect.soft(deleteFrBtnLocator).not.toBeVisible();
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Mon titre français');
  });
});
