import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { Locator, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

function stringsPanel(page: Page, languageTag: string): Locator {
  return page.getByTestId(`lang-panel-${languageTag}`);
}

async function selectLanguageTab(page: Page, languageTag: string): Promise<void> {
  await page.getByTestId(`lang-tab-${languageTag}`).click();
}

async function openTabsAndAddFrench(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Translate' }).click();
  await page.getByTestId('lang-tab-add-fr').click();
  await expect.soft(page.getByTestId('lang-tab-fr')).toBeVisible();
}

test('checks item edit strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const translateCtaLocator = page.getByRole('button', { name: 'Translate' });

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();

  await test.step('Checks the new item with no other translates is displayed', async () => {
    const enPanel = stringsPanel(page, 'en');
    await expect.soft(enPanel.getByTestId('item-strings-title')).toBeVisible();
    await expect.soft(enPanel.getByTestId('item-strings-subtitle')).toBeVisible();
    await expect.soft(enPanel.getByTestId('item-strings-description')).toBeVisible();
    await expect.soft(translateCtaLocator).toBeVisible();
  });

  await test.step('Add new translate information section', async () => {
    await openTabsAndAddFrench(page);

    const frPanel = stringsPanel(page, 'fr');
    await expect.soft(frPanel.getByTestId('item-strings-title')).toBeVisible();
    await expect.soft(frPanel.getByTestId('item-strings-subtitle')).toBeVisible();
    await expect.soft(frPanel.getByTestId('item-strings-description')).toBeVisible();
  });

  await test.step('Fill new translate data and check cancel changes', async () => {
    await selectLanguageTab(page, 'en');
    await stringsPanel(page, 'en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Title (en)');
    await stringsPanel(page, 'en').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox').fill('Subtitle (en)');
    await stringsPanel(page, 'en').getByTestId('item-strings-description').locator('textarea').fill('Description (en)');

    await selectLanguageTab(page, 'fr');
    await stringsPanel(page, 'fr').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await stringsPanel(page, 'fr').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await stringsPanel(page, 'fr').getByTestId('item-strings-description').locator('textarea').fill('Description (fr)');

    await itemContentPage.cancelChanges();

    await expect.soft(stringsPanel(page, 'en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox')).toHaveValue(createItem.itemName);
    await expect.soft(translateCtaLocator).toBeVisible();
    await expect.soft(page.getByTestId('lang-tab-fr')).not.toBeVisible();
  });

  await test.step('Add new translate information section', async () => {
    await openTabsAndAddFrench(page);
  });

  await test.step('Check base validation for new translate section', async () => {
    await selectLanguageTab(page, 'fr');
    await expect.soft(stringsPanel(page, 'fr').getByTestId('item-strings-title').locator('alg-input').getByText('This field is required')).toBeVisible();
    await itemContentPage.saveChanges();
    await itemContentPage.checkToastNotification('You need to solve all the');
  });

  await test.step('Fill new translates data and save changes', async () => {
    await selectLanguageTab(page, 'en');
    await stringsPanel(page, 'en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Title (en)');
    await stringsPanel(page, 'en').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox').fill('Subtitle (en)');
    await stringsPanel(page, 'en').getByTestId('item-strings-description').locator('textarea').fill('Description (en)');

    await selectLanguageTab(page, 'fr');
    await stringsPanel(page, 'fr').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await stringsPanel(page, 'fr').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await stringsPanel(page, 'fr').getByTestId('item-strings-description').locator('textarea').fill('Description (fr)');

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks translation data is displayed after save changes', async () => {
    await selectLanguageTab(page, 'en');
    await expect.soft(stringsPanel(page, 'en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox')).toHaveValue('Title (en)');
    await expect.soft(stringsPanel(page, 'en').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (en)');
    await expect.soft(stringsPanel(page, 'en').getByTestId('item-strings-description').locator('textarea')).toHaveValue('Description (en)');

    await selectLanguageTab(page, 'fr');
    await expect.soft(stringsPanel(page, 'fr').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
    await expect.soft(stringsPanel(page, 'fr').getByTestId('item-strings-subtitle').locator('alg-input').getByRole('textbox')).toHaveValue('Subtitle (fr)');
    await expect.soft(stringsPanel(page, 'fr').getByTestId('item-strings-description').locator('textarea')).toHaveValue('Description (fr)');
  });

  await test.step('Change title to back initial for delete it successfully', async () => {
    await selectLanguageTab(page, 'en');
    await stringsPanel(page, 'en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill(createItem.itemName);
    await itemContentPage.saveChangesAndCheckNotification();
  });
});
