import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('checks item delete strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const itemStringsSectionLocator = page.getByTestId('item-strings-control');
  const itemStringsSectionEnLocator = itemStringsSectionLocator.nth(0);
  const itemStringsSectionFrLocator = itemStringsSectionLocator.nth(1);

  const translateBtnLocator = page.locator('alg-item-all-strings-form').getByRole('button', { name: 'Translate to fr' });

  const itemStringsTitleFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-title');
  const itemStringsSubtitleFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-subtitle');
  const itemStringsDescriptionFrLocator = itemStringsSectionFrLocator.getByTestId('item-strings-description');

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

  await test.step('Checks the default translate delete button is disabled', async () => {
    await expect.soft(itemStringsSectionEnLocator.getByTestId('delete-strings-button-section')).toBeVisible();
    await expect.soft(itemStringsSectionEnLocator.getByTestId('delete-strings-button-section').getByRole('button')).toBeDisabled();
  });

  await test.step('Checks delete fr translate flow', async () => {
    const deleteBtnLocator = itemStringsSectionFrLocator.getByTestId('delete-strings-button-section').getByRole('button');
    await expect.soft(itemStringsSectionFrLocator.getByTestId('delete-strings-button-section')).toBeVisible();
    await expect.soft(deleteBtnLocator).toBeEnabled();
    await deleteBtnLocator.click();
    await expect.soft(itemStringsSectionFrLocator).not.toBeVisible();
  });

  await test.step('Checks cancel changes', async () => {
    await itemContentPage.cancelChanges();
    await expect.soft(itemStringsSectionFrLocator).toBeVisible();
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
    await expect.soft(itemStringsSubtitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (fr)');
    await expect.soft(itemStringsDescriptionFrLocator.locator('textarea')).toHaveValue('Description (fr)');
  });

  await test.step('Checks delete fr translate and save changes', async () => {
    const deleteBtnLocator = itemStringsSectionFrLocator.getByTestId('delete-strings-button-section').getByRole('button');
    await expect.soft(itemStringsSectionFrLocator.getByTestId('delete-strings-button-section')).toBeVisible();
    await expect.soft(deleteBtnLocator).toBeEnabled();
    await deleteBtnLocator.click();
    await expect.soft(itemStringsSectionFrLocator).not.toBeVisible();
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks the fr section is not displayed', async () => {
    await expect.soft(itemStringsSectionFrLocator).not.toBeVisible();
  });
});
