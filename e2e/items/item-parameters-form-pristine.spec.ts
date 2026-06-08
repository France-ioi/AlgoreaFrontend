import { expect, test } from 'e2e/common/fixture';
import { Page } from '@playwright/test';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test.describe.configure({ mode: 'serial' });

test.describe('floating save visibility on parameters load', () => {
  test('single-language item: no save bar on load (item supports one language)', async ({ page, createItem, itemContentPage }) => {
    if (!createItem) throw new Error('The item is not created');

    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });
    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(page.getByRole('heading', { name: 'Header & Description' })).toBeVisible();
    await expect.soft(page.getByTestId('lang-panel-en')).toBeVisible();
    await expect.soft(saveBtnLocator).not.toBeVisible();
    await expect.soft(cancelBtnLocator).not.toBeVisible();
  });

  test('single-language item: save bar appears after editing the title', async ({ page, createItem, itemContentPage }) => {
    if (!createItem) throw new Error('The item is not created');

    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });

    await Promise.all([
      page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(saveBtnLocator).not.toBeVisible();

    await page.getByTestId('lang-panel-en').getByTestId('item-strings-title').locator('alg-input').getByRole('textbox').fill('Edited title');

    await expect.soft(saveBtnLocator).toBeVisible();
    await expect.soft(cancelBtnLocator).toBeVisible();
  });
});

test.describe('floating save visibility with pre-populated masked fields', () => {
  const participationSwitchLocator = (page: Page) => page.getByTestId('form-item-view')
    .filter({ hasText: /^Start participation manually$/ })
    .locator('alg-switch');

  test('duration: no save bar after reload with saved duration', async ({ page, createItem, itemContentPage, duration }) => {
    if (!createItem) throw new Error('The item is not created');

    const paramsUrl = `a/${createItem.itemId};p=${rootItemId};pa=0/parameters`;
    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });

    await Promise.all([
      page.goto(paramsUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await participationSwitchLocator(page).click();
    await page.getByTestId('form-item-view').filter({ hasText: 'Duration' }).locator('alg-switch').click();
    await duration.fillH('01');
    await duration.fillM('10');
    await duration.fillS('15');
    await itemContentPage.saveChangesAndCheckNotification();

    await Promise.all([
      page.goto(paramsUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(page.getByRole('heading', { name: 'Participation' })).toBeVisible();
    await expect.soft(saveBtnLocator).not.toBeVisible();
    await expect.soft(cancelBtnLocator).not.toBeVisible();
    await duration.checksIsHHasValue('1');
    await duration.checksIsMHasValue('10');
    await duration.checksIsSHasValue('15');

    await duration.fillM('11');
    await expect.soft(saveBtnLocator).toBeVisible();
    await expect.soft(cancelBtnLocator).toBeVisible();
  });

  test('date: no save bar after reload with saved entering time', async ({ page, createItem, itemContentPage }) => {
    if (!createItem) throw new Error('The item is not created');

    const paramsUrl = `a/${createItem.itemId};p=${rootItemId};pa=0/parameters`;
    const saveBtnLocator = page.getByRole('button', { name: 'Save' });
    const cancelBtnLocator = page.getByRole('button', { name: 'Cancel Changes' });
    const enteringTimeMinContainerLocator = page.getByTestId('entering-time-min-container');
    const enteringTimeMinInputDateLocator = enteringTimeMinContainerLocator
      .locator('alg-input-date')
      .getByTestId('input-date');
    const savedDate = '01/01/2030 10:00';

    await Promise.all([
      page.goto(paramsUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await participationSwitchLocator(page).click();
    await enteringTimeMinContainerLocator.locator('alg-switch').click();
    await enteringTimeMinInputDateLocator.fill(savedDate);
    await itemContentPage.saveChangesAndCheckNotification();

    await Promise.all([
      page.goto(paramsUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);

    await expect.soft(saveBtnLocator).not.toBeVisible();
    await expect.soft(cancelBtnLocator).not.toBeVisible();
    await expect.soft(enteringTimeMinInputDateLocator).toHaveValue(savedDate);

    await enteringTimeMinInputDateLocator.fill('01/01/2030 11:00');
    await expect.soft(saveBtnLocator).toBeVisible();
    await expect.soft(cancelBtnLocator).toBeVisible();
  });
});
