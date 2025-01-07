import { test, expect } from 'e2e/items/fixture';

test('check unlocked items and navigate to first one', async ({ page }) => {
  await page.goto('a/2004936693550411739;p=4702,7528142386663912287,7523720120450464843;pa=0');
  expect.soft(page.getByTestId('item-title').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.frameLocator('iFrame').getByText('A brief history of blockchain')).toBeVisible();
  const mainContentWrapperLocator = page.getByTestId('main-content-wrapper');
  await expect.soft(mainContentWrapperLocator).toBeVisible();
  await mainContentWrapperLocator.evaluate(node =>
    node.scrollBy({ top: node.scrollHeight })
  );
  await expect.soft(page.locator('p-treenode').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.getByText('Unlocked content')).toBeVisible();
  const firstUnlockedItem = page.getByText('Chapter unlocked by other tasks');
  await expect.soft(firstUnlockedItem).toBeVisible();
  await firstUnlockedItem.click();
  await expect.soft(page.getByTestId('item-title').getByText('Chapter unlocked by other tasks')).toBeVisible();
});

test('check unlocked items and stay on current task', async ({ page }) => {
  await page.goto('a/2004936693550411739;p=4702,7528142386663912287,7523720120450464843;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Long text task (opentezos-like)');
  expect.soft(itemTitleLocator).toBeVisible();
  await expect.soft(page.frameLocator('iFrame').getByText('A brief history of blockchain')).toBeVisible();
  const mainContentWrapperLocator = page.getByTestId('main-content-wrapper');
  await expect.soft(mainContentWrapperLocator).toBeVisible();
  await mainContentWrapperLocator.evaluate(node =>
    node.scrollBy({ top: node.scrollHeight })
  );
  await expect.soft(page.locator('p-treenode').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.getByText('Unlocked content')).toBeVisible();
  const continueBtnLocator = page.getByText('Continue on the current content');
  await expect.soft(continueBtnLocator).toBeVisible();
  await continueBtnLocator.click();
  await expect.soft(itemTitleLocator).toBeVisible();
});
