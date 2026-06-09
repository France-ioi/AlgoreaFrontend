import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('persists children layout selection after save and page refresh', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  const paramsUrl = `a/${createItem.itemId};p=${rootItemId};pa=0/parameters`;
  const childrenLayoutView = page.locator('.form-item-view').filter({ hasText: 'Children layout' });
  const childrenLayoutSelection = childrenLayoutView.locator('alg-selection');
  const activeLayoutLabel = childrenLayoutSelection.locator('li.active .label');

  await Promise.all([
    page.goto(paramsUrl),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Display' })).toBeVisible();
  await expect.soft(childrenLayoutSelection).toBeVisible();
  await expect.soft(activeLayoutLabel).toHaveText('List');

  await test.step('Select Grid and save', async () => {
    await childrenLayoutSelection.getByTestId('selection-control-value').filter({ hasText: 'Grid' }).click();
    await expect.soft(activeLayoutLabel).toHaveText('Grid');

    const itemPut = page.waitForResponse(resp =>
      resp.request().method() === 'PUT'
      && resp.url() === `${apiUrl}/items/${createItem.itemId}`
      && resp.request().postData()?.includes('"children_layout":"Grid"') === true
      && resp.ok());
    await Promise.all([
      itemPut,
      itemContentPage.saveChangesAndCheckNotification(),
    ]);
  });

  await test.step('Reload parameters and check selection was not reset to List', async () => {
    await Promise.all([
      page.goto(paramsUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect.soft(childrenLayoutSelection).toBeVisible();
    await expect.soft(activeLayoutLabel).toHaveText('Grid');
  });
});
