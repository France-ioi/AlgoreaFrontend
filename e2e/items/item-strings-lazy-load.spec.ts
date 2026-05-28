import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('lazy-loads a translation only when its tab is opened', async ({ page, createItem, itemContentPage }) => {
  if (!createItem) throw new Error('The item is not created');

  let frRequestCount = 0;

  await page.route(`**${apiUrl}/items/${createItem.itemId}?language_tag=fr`, async route => {
    frRequestCount += 1;
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await test.step('Open tabs and add French without fetching it yet', async () => {
    await page.getByRole('button', { name: 'Translate' }).click();
    await page.getByTestId('lang-tab-add-fr').click();
    await itemContentPage.saveChangesAndCheckNotification();
  });

  frRequestCount = 0;

  await Promise.all([
    page.reload(),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();
  await expect.soft(page.getByTestId('lang-tab-en')).toBeVisible({ timeout: 10000 });
  await expect.soft(page.getByTestId('lang-tab-fr')).toBeVisible();
  expect(frRequestCount).toBe(0);

  await test.step('French content loads only after selecting the fr tab', async () => {
    const frPanel = page.getByTestId('lang-panel-fr');
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(frPanel.getByTestId('lang-tab-loading')).toBeVisible();
    await expect.soft(frPanel.getByTestId('item-strings-title')).toBeVisible({ timeout: 10000 });
    expect(frRequestCount).toBe(1);
  });
});
