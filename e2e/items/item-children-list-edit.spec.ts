import { test, expect } from '../common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('check item children edit score weight', async ({ page, createItem, itemChildrenEditListComponent, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');
  await page.goto(`/a/${createItem.itemId};p=${rootItemId};pa=0/edit-children`);
  const firstRowLocator = page.locator('alg-item-children-edit-list').getByRole('table').getByRole('row').filter({ hasText: 'Item #1' });
  const editInputLocator = firstRowLocator.getByTestId('edit-score-weight').getByRole('textbox');

  await test.step('checks the children list are visible', async () => {
    await itemContentPage.waitForItemResponse(createItem.itemId);
    await itemContentPage.checksIsAddContentVisible();
    await itemContentPage.addChildItem('Item #1');
    await expect.soft(firstRowLocator).toBeVisible();
  });

  await test.step('checks the number input', async () => {
    await itemChildrenEditListComponent.toggleEnableScoreWeight();
    await expect.soft(editInputLocator).toBeVisible();
    await editInputLocator.fill('50');
  });

  await test.step('checks max value validation', async () => {
    await editInputLocator.fill('200');
    await expect.soft(editInputLocator).toHaveValue('100');
  });
});
