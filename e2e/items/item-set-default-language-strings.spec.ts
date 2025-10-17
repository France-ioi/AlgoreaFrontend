import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('checks item set default language strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const itemStringsSectionLocator = page.getByTestId('item-strings-control');
  const itemStringsSectionEnLocator = itemStringsSectionLocator.nth(0);
  const deleteEnBtnLocator = itemStringsSectionEnLocator.getByTestId('remove-language-btn');
  const setDefaultEnBtnLocator = itemStringsSectionEnLocator.getByTestId('set-default-language-btn');

  const itemStringsSectionFrLocator = itemStringsSectionLocator.nth(1);

  const translateBtnLocator = page.locator('alg-item-all-strings-form').getByRole('button', { name: 'Translate to fr' });

  const itemStringsTitleFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-title');
  const itemStringsSubtitleFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-subtitle');
  const itemStringsDescriptionFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-description');
  const deleteFrBtnLocator = itemStringsSectionFrLocator.getByTestId('remove-language-btn');
  const setDefaultFrBtnLocator = itemStringsSectionFrLocator.getByTestId('set-default-language-btn');

  await page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`);

  await expect.soft(page.getByRole('heading', { name: 'Information (en)' })).toBeVisible();

  await test.step('Add new translate information section', async () => {
    await expect.soft(translateBtnLocator).toBeVisible();
    await translateBtnLocator.click();

    await expect.soft(translateBtnLocator).not.toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Information (fr)' })).toBeVisible();
    await expect.soft(itemStringsTitleFrLocator).toBeVisible();
    await expect.soft(itemStringsSubtitleFrLocator).toBeVisible();
    await expect.soft(itemStringsDescriptionFrLocator).toBeVisible();
  });

  await test.step('Fill new translates data and save changes', async () => {
    await itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await itemStringsSubtitleFrLocator.locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await itemStringsDescriptionFrLocator.locator('textarea').fill('Description (fr)');

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks translation data is displayed after save changes', async () => {
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
    await expect.soft(itemStringsSubtitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (fr)');
    await expect.soft(itemStringsDescriptionFrLocator.locator('textarea')).toHaveValue('Description (fr)');
  });

  await test.step('Checks en is default flow', async () => {
    await expect.soft(deleteEnBtnLocator).toBeVisible();
    await expect.soft(deleteEnBtnLocator).toBeDisabled();
    await expect.soft(setDefaultEnBtnLocator).not.toBeVisible();
    await expect.soft(deleteFrBtnLocator).toBeVisible();
  });

  await test.step('Checks the fr translate set default is visible and change to fr', async () => {
    await expect.soft(setDefaultFrBtnLocator).toBeVisible();
    await setDefaultFrBtnLocator.click();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
  });

  await test.step('Checks the fr is default flow and save changes', async () => {
    await expect.soft(deleteEnBtnLocator).toBeEnabled();
    await expect.soft(deleteFrBtnLocator).toBeDisabled();
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks the fr language is default', async () => {
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
  });
});
