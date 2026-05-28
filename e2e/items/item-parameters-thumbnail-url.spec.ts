import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

const testThumbnailUrl = 'https://cdn.prod.website-files.com/66d16ac0a28e9fc29617fc2e/673b41ccea45ed2c55cf536b_angular-16-banner.jpg';
const secondTestThumbnailUrl = 'https://www.ryadel.com/wp-content/uploads/2017/10/angular-logo.jpg';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks edit parameters - thumbnail url', async ({ page, createItem, itemContentPage }, use) => {
  if (!createItem) throw new Error('The item is not created');
  const thumbnailUrlLocator = page.locator('div').filter({ hasText: /^Thumbnail url$/ });
  const thumbnailInputLocator = thumbnailUrlLocator.locator('input');

  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Display' })).toBeVisible();

  await test.step('Fill thumbnail url', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(thumbnailInputLocator).toBeVisible();
    await thumbnailInputLocator.fill(testThumbnailUrl);
  });

  await test.step('Save thumbnail url and check saved value', async () => {
    const itemPut = page.waitForResponse(resp =>
      resp.request().method() === 'PUT'
      && resp.url() === `${apiUrl}/items/${createItem.itemId}`
      && resp.request().postData()?.includes('"thumbnail_url"') === true
      && resp.ok());
    await Promise.all([
      itemPut,
      itemContentPage.saveChangesAndCheckNotification(),
    ]);
    await expect.soft(thumbnailInputLocator).toHaveValue(testThumbnailUrl);
  });

  await test.step('Switch lang to fr and check that the value still displayed', async () => {
    await page.getByRole('button', { name: 'Translate' }).click();
    await page.getByTestId('lang-tab-add-fr').click();
    await page.getByTestId('lang-panel-fr').getByTestId('item-strings-title')
      .locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(thumbnailInputLocator).toHaveValue(testThumbnailUrl);
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Fill another thumbnail url with fr as default', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(thumbnailInputLocator).toBeVisible();
    await thumbnailInputLocator.fill(secondTestThumbnailUrl);
  });

  await test.step('Save thumbnail url and check saved value on en version', async () => {
    await page.getByTestId('lang-tab-en').click();
    const itemPut = page.waitForResponse(resp =>
      resp.request().method() === 'PUT'
      && resp.url() === `${apiUrl}/items/${createItem.itemId}`
      && resp.request().postData()?.includes('"thumbnail_url"') === true
      && resp.ok());
    await Promise.all([
      itemPut,
      itemContentPage.saveChanges(),
    ]);
    await expect.soft(thumbnailInputLocator).toHaveValue(secondTestThumbnailUrl);
    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(thumbnailInputLocator).toHaveValue(secondTestThumbnailUrl);
  });

  await test.step('Clearing the thumbnail clears display_settings', async () => {
    const clearItemRequest = page.waitForRequest(req =>
      req.method() === 'PUT'
      && req.url() === `${apiUrl}/items/${createItem.itemId}`
      && req.postData()?.includes('display_settings') === true);

    await thumbnailInputLocator.fill('');
    await Promise.all([
      clearItemRequest,
      itemContentPage.saveChangesAndCheckNotification(),
    ]);

    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(thumbnailInputLocator).toHaveValue('');
  });

});
