import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

const testImageUrl = 'https://cdn.prod.website-files.com/66d16ac0a28e9fc29617fc2e/673b41ccea45ed2c55cf536b_angular-16-banner.jpg';
const secondTestImageUrl = 'https://www.ryadel.com/wp-content/uploads/2017/10/angular-logo.jpg';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks edit parameters - image url', async ({ page, createItem, itemContentPage }, use) => {
  if (!createItem) throw new Error('The item is not created');
  const thumbnailUrlLocator = page.locator('div').filter({ hasText: /^Thumbnail url$/ });
  const imageUrlInputLocator = thumbnailUrlLocator.locator('input');

  // Set up the response listener BEFORE the navigation so we never miss the response: on a slow
  // runner, the heading assertion that follows can otherwise burn most of the test budget waiting
  // for data to arrive.
  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Display' })).toBeVisible();

  await test.step('Fill image url', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await imageUrlInputLocator.fill(testImageUrl);
  });

  await test.step('Save image url and check saved value', async () => {
    await itemContentPage.saveChangesAndCheckNotification();
    await expect.soft(imageUrlInputLocator).toHaveValue(testImageUrl);
  });

  await test.step('Switch lang to fr and check that the value still displayed', async () => {
    await page.getByRole('button', { name: 'Translate' }).click();
    await page.getByTestId('lang-tab-add-fr').click();
    await page.getByTestId('lang-panel-fr').getByTestId('item-strings-title')
      .locator('alg-input').getByRole('textbox').fill('Title (fr)');
    await page.getByTestId('lang-tab-fr').click();
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toHaveValue(testImageUrl);
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('Fill another image url on fr item as default', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await imageUrlInputLocator.fill(secondTestImageUrl);
  });

  await test.step('Save image url and check saved value on en version', async () => {
    await page.getByTestId('lang-tab-en').click();
    const imageUrlPut = page.waitForResponse(resp =>
      resp.request().method() === 'PUT'
      && resp.url().includes(`/items/${createItem.itemId}/strings/`)
      && resp.request().postData()?.includes('"image_url"') === true
      && resp.ok());
    await Promise.all([
      imageUrlPut,
      itemContentPage.saveChanges(),
    ]);
    await expect.soft(imageUrlInputLocator).toHaveValue(secondTestImageUrl);
    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toHaveValue(secondTestImageUrl);
  });

  await test.step('Clearing the image url sends image_url: null and persists across reload', async () => {
    const clearRequest = page.waitForRequest(req =>
      req.method() === 'PUT'
      && req.url().startsWith(`${apiUrl}/items/${createItem.itemId}/strings/`)
      && req.postData()?.includes('"image_url":null') === true);

    await imageUrlInputLocator.fill('');
    await Promise.all([
      clearRequest,
      itemContentPage.saveChangesAndCheckNotification(),
    ]);

    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toHaveValue('');
  });

});
