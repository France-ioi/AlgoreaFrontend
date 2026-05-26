import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

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

  const itemStringsSectionLocator = page.getByTestId('item-strings-control');
  const itemStringsSectionEnLocator = itemStringsSectionLocator.nth(0);
  const setDefaultEnBtnLocator = itemStringsSectionEnLocator.getByTestId('set-default-language-btn');

  const itemStringsSectionFrLocator = itemStringsSectionLocator.nth(1);
  const itemStringsTitleFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-title');
  const setDefaultFrBtnLocator = itemStringsSectionFrLocator.getByTestId('set-default-language-btn');
  const deleteFrBtnLocator = itemStringsSectionFrLocator.getByTestId('remove-language-btn');

  const translateBtnLocator = page.locator('alg-item-all-strings-form').getByRole('button', { name: 'Translate to fr' });

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Information (en)' })).toBeVisible();

  await test.step('Add a French translation, fill it, and promote it to default', async () => {
    await expect.soft(translateBtnLocator).toBeVisible();
    await translateBtnLocator.click();

    await expect.soft(itemStringsTitleFrLocator).toBeVisible();
    await itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox').fill('Mon titre français');

    await expect.soft(setDefaultFrBtnLocator).toBeVisible();
    await setDefaultFrBtnLocator.click();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('After save, French is the default language', async () => {
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
    await expect.soft(deleteFrBtnLocator).toBeDisabled();
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Mon titre français');
  });
});
