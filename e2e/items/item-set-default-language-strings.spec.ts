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

test('checks item set default language strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const enTabLocator = page.getByTestId('lang-tab-en');
  const frTabLocator = page.getByTestId('lang-tab-fr');
  const deleteEnBtnLocator = page.getByTestId('lang-tab-row-en').getByTestId('remove-language-btn');
  const deleteFrBtnLocator = page.getByTestId('lang-tab-row-fr').getByTestId('remove-language-btn');
  const setDefaultFrBtnLocator = page.getByTestId('lang-panel-fr').getByTestId('set-default-language-btn');
  const setDefaultEnBtnLocator = page.getByTestId('lang-panel-en').getByTestId('set-default-language-btn');

  const itemStringsTitleFrLocator = page.getByTestId('lang-panel-fr').getByTestId('item-strings-title');
  const itemStringsSubtitleFrLocator = page.getByTestId('lang-panel-fr').getByTestId('item-strings-subtitle');
  const itemStringsDescriptionFrLocator = page.getByTestId('lang-panel-fr').getByTestId('item-strings-description');

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();

  await test.step('Add new translate information section', async () => {
    await openTabsAndAddFrench(page);
    await expect.soft(itemStringsTitleFrLocator).toBeVisible();
  });

  await test.step('Fill new translates data and save changes', async () => {
    await itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await itemStringsSubtitleFrLocator.locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await itemStringsDescriptionFrLocator.locator('textarea').fill('Description (fr)');

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks en is default flow', async () => {
    await page.getByTestId('lang-tab-en').click();
    await expect.soft(deleteEnBtnLocator).not.toBeVisible();
    await expect.soft(setDefaultEnBtnLocator).not.toBeVisible();
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(deleteFrBtnLocator).toBeVisible();
  });

  await test.step('Checks the fr translate set default is visible and change to fr', async () => {
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(setDefaultFrBtnLocator).toBeVisible();
    await setDefaultFrBtnLocator.click();
    await expect.soft(frTabLocator).toContainText('(default)');
    await expect.soft(enTabLocator).not.toContainText('(default)');
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
  });

  await test.step('Checks the fr is default flow and save changes', async () => {
    await page.getByTestId('lang-tab-en').click();
    await expect.soft(deleteEnBtnLocator).toBeVisible();
    await expect.soft(deleteFrBtnLocator).not.toBeVisible();
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks the fr language is default', async () => {
    await expect.soft(frTabLocator).toContainText('(default)');
    await expect.soft(setDefaultFrBtnLocator).not.toBeVisible();
    await page.getByTestId('lang-tab-en').click();
    await expect.soft(setDefaultEnBtnLocator).toBeVisible();
  });
});
