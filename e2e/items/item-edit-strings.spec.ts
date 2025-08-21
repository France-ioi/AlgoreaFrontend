import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('checks item edit strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const itemStringsSectionLocator = page.locator('alg-item-strings-control');
  const itemStringsTitleLocator = itemStringsSectionLocator.getByTestId('item-strings-title');
  const itemStringsSubtitleLocator = itemStringsSectionLocator.getByTestId('item-strings-subtitle');
  const itemStringsDescriptionLocator = itemStringsSectionLocator.getByTestId('item-strings-description');
  const translateBtnLocator = page.locator('alg-item-all-strings-form').getByRole('button', { name: 'Translate in fr' });

  await page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`);

  await expect.soft(page.getByRole('heading', { name: 'Information (en)' })).toBeVisible();

  await test.step('Checks the new item with no other translates is displayed', async () => {
    await expect.soft(itemStringsTitleLocator.first()).toBeVisible();
    await expect.soft(itemStringsSubtitleLocator.first()).toBeVisible();
    await expect.soft(itemStringsDescriptionLocator.first()).toBeVisible();
  });

  await test.step('Add new translate information section', async () => {
    await expect.soft(translateBtnLocator).toBeVisible();
    await translateBtnLocator.click();

    await expect.soft(translateBtnLocator).not.toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Information (fr)' })).toBeVisible();
    await expect.soft(itemStringsTitleLocator.nth(1)).toBeVisible();
    await expect.soft(itemStringsSubtitleLocator.nth(1)).toBeVisible();
    await expect.soft(itemStringsDescriptionLocator.nth(1)).toBeVisible();
  });

  await test.step('Fill new translate data and check cancel changes', async () => {
    await itemStringsTitleLocator.nth(0).locator('alg-input').getByRole('textbox').fill('Title (en)');
    await itemStringsSubtitleLocator.nth(0).locator('alg-input').getByRole('textbox').fill('Subtitle (en)');
    await itemStringsDescriptionLocator.nth(0).locator('textarea').fill('Description (en)');

    await itemStringsTitleLocator.nth(1).locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await itemStringsSubtitleLocator.nth(1).locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await itemStringsDescriptionLocator.nth(1).locator('textarea').fill('Description (fr)');

    await itemContentPage.cancelChanges();

    await expect.soft(itemStringsTitleLocator.nth(0).locator('alg-input').getByRole('textbox')).toHaveValue(createItem.itemName);
    await expect.soft(page.getByRole('heading', { name: 'Information (fr)' })).not.toBeVisible();
  });

  await test.step('Add new translate information section', async () => {
    await expect.soft(translateBtnLocator).toBeVisible();
    await translateBtnLocator.click();

    await expect.soft(translateBtnLocator).not.toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Information (fr)' })).toBeVisible();
    await expect.soft(itemStringsTitleLocator.nth(1)).toBeVisible();
    await expect.soft(itemStringsSubtitleLocator.nth(1)).toBeVisible();
    await expect.soft(itemStringsDescriptionLocator.nth(1)).toBeVisible();
  });

  await test.step('Fill new translates data and save changes', async () => {
    await itemStringsTitleLocator.nth(0).locator('alg-input').getByRole('textbox').fill('Title (en)');
    await itemStringsSubtitleLocator.nth(0).locator('alg-input').getByRole('textbox').fill('Subtitle (en)');
    await itemStringsDescriptionLocator.nth(0).locator('textarea').fill('Description (en)');

    await itemStringsTitleLocator.nth(1).locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await itemStringsSubtitleLocator.nth(1).locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await itemStringsDescriptionLocator.nth(1).locator('textarea').fill('Description (fr)');

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks translation data is displayed after save changes', async () => {
    await expect.soft(itemStringsTitleLocator.nth(0).locator('alg-input').getByRole('textbox')).toHaveValue('Title (en)');
    await expect.soft(itemStringsSubtitleLocator.nth(0).locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (en)');
    await expect.soft(itemStringsDescriptionLocator.nth(0).locator('textarea')).toHaveValue('Description (en)');

    await expect.soft(itemStringsTitleLocator.nth(1).locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
    await expect.soft(itemStringsSubtitleLocator.nth(1).locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (fr)');
    await expect.soft(itemStringsDescriptionLocator.nth(1).locator('textarea')).toHaveValue('Description (fr)');
  });

  await test.step('Change title to back initial for delete it successfully', async () => {
    await itemStringsTitleLocator.nth(0).locator('alg-input').getByRole('textbox').fill(createItem.itemName);
    await itemContentPage.saveChangesAndCheckNotification();
  });
});
