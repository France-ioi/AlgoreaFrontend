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

test('checks item delete strings', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const deleteEnBtnLocator = page.getByTestId('lang-tab-row-en').getByTestId('remove-language-btn');
  const frTabLocator = page.getByTestId('lang-tab-fr');
  const frPanelLocator = page.getByTestId('lang-panel-fr');
  const itemStringsTitleFrLocator = frPanelLocator.getByTestId('item-strings-title');
  const itemStringsSubtitleFrLocator = frPanelLocator.getByTestId('item-strings-subtitle');
  const itemStringsDescriptionFrLocator = frPanelLocator.getByTestId('item-strings-description');
  const deleteFrBtnLocator = page.getByTestId('lang-tab-row-fr').getByTestId('remove-language-btn');

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();

  await test.step('Add new translate information section', async () => {
    await openTabsAndAddFrench(page);
    await expect.soft(frTabLocator).toBeVisible();
    await expect.soft(itemStringsTitleFrLocator).toBeVisible();
  });

  await test.step('Fill new translates data and save changes', async () => {
    await frTabLocator.click();
    await itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await itemStringsSubtitleFrLocator.locator('alg-input').getByRole('textbox').fill('Subtitle (fr)');
    await itemStringsDescriptionFrLocator.locator('textarea').fill('Description (fr)');

    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks translation data is displayed after save changes', async () => {
    await frTabLocator.click();
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
  });

  await test.step('Checks the default translate has no delete button', async () => {
    await expect.soft(deleteEnBtnLocator).not.toBeVisible();
  });

  await test.step('Checks pending-delete fr translate flow', async () => {
    await frTabLocator.click();
    await expect.soft(deleteFrBtnLocator).toBeVisible();
    await deleteFrBtnLocator.click();
    await expect.soft(frTabLocator).toHaveClass(/pending-deletion/);
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toBeDisabled();
    await expect.soft(page.getByTestId('lang-tab-add-fr')).not.toBeVisible();
  });

  await test.step('Checks cancel changes', async () => {
    await itemContentPage.cancelChanges();
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(itemStringsTitleFrLocator.locator('alg-input').getByRole('textbox')).toHaveValue('Title (fr)');
    await expect.soft(frTabLocator).not.toHaveClass(/pending-deletion/);
  });

  await test.step('Checks delete fr translate and save changes', async () => {
    await page.getByTestId('lang-tab-fr').click();
    await deleteFrBtnLocator.click();
    await expect.soft(frTabLocator).toHaveClass(/pending-deletion/);
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Checks the fr tab is not displayed after save', async () => {
    await expect.soft(frTabLocator).not.toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Translate' })).toBeVisible();
  });
});
