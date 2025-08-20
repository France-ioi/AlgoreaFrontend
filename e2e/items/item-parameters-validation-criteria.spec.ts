import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks edit parameters - validation criteria', async ({ page, createItem, itemContentPage }, use) => {
  if (!createItem) throw new Error('The item is not created');
  await Promise.all([
    await page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    await itemContentPage.waitForItemResponse(createItem.itemId),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Score & Validation' })).toBeVisible();
  const selectLocator = page.locator('alg-select').filter({ has: page.getByText('All children validated') });
  await expect.soft(selectLocator).toBeVisible();
  await selectLocator.click();
  const targetOptionLocator = page.locator('alg-select-option').getByText('Never');
  await expect.soft(targetOptionLocator).toBeVisible();
  await targetOptionLocator.click();
  await expect.soft(targetOptionLocator).not.toBeVisible();
  await itemContentPage.checkIsTranslatesLoaded();
  await itemContentPage.saveChangesAndCheckNotification();
  await expect.soft(page.locator('alg-select').getByText('Never')).toBeVisible();
});
