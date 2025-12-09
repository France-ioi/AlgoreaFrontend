import { test, expect } from 'e2e/items/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test('check unlocked items and navigate to first one', async ({ page }) => {
  await page.goto('a/2004936693550411739;p=4702,7528142386663912287,7523720120450464843;pa=0');
  await expect.soft(page.getByTestId('item-title').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.frameLocator('iFrame').getByText('A brief history of blockchain')).toBeVisible();
  const mainContentWrapperLocator = page.getByTestId('main-content-wrapper');
  await expect.soft(mainContentWrapperLocator).toBeVisible();
  await mainContentWrapperLocator.evaluate(node =>
    node.scrollBy({ top: node.scrollHeight })
  );
  await expect.soft(page.locator('cdk-nested-tree-node').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.getByText('Unlocked content')).toBeVisible();
  const firstUnlockedItem = page.getByText('Chapter unlocked by other tasks');
  await expect.soft(firstUnlockedItem).toBeVisible();
  await firstUnlockedItem.click();
  await expect.soft(page.getByTestId('item-title').getByText('Chapter unlocked by other tasks')).toBeVisible();
});

test('check unlocked items and stay on current task', async ({ page }) => {
  await page.goto('a/2004936693550411739;p=4702,7528142386663912287,7523720120450464843;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Long text task (opentezos-like)');
  await expect.soft(itemTitleLocator).toBeVisible();
  await expect.soft(page.frameLocator('iFrame').getByText('A brief history of blockchain')).toBeVisible();
  const mainContentWrapperLocator = page.getByTestId('main-content-wrapper');
  await expect.soft(mainContentWrapperLocator).toBeVisible();
  await mainContentWrapperLocator.evaluate(node =>
    node.scrollBy({ top: node.scrollHeight })
  );
  await expect.soft(page.locator('cdk-nested-tree-node').getByText('Long text task (opentezos-like)')).toBeVisible();
  await expect.soft(page.getByText('Unlocked content')).toBeVisible();
  const continueBtnLocator = page.getByText('Continue on the current content');
  await expect.soft(continueBtnLocator).toBeVisible();
  await continueBtnLocator.click();
  await expect.soft(itemTitleLocator).toBeVisible();
});

test('check chapter is locked message for temp user', async ({ page, itemContentPage }) => {
  await page.goto('a/457754150968902848;p=4702,7528142386663912287,944619266928306927;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Chapter unlocked by other tasks');
  await expect.soft(itemTitleLocator).toBeVisible();
  await itemContentPage.checksIsChapterLockedMessageVisible();
});

test('check chapter is locked message for auth user', async ({ page, itemContentPage }) => {
  await initAsTesterUser(page);
  await page.goto('a/7765874445258315610;p=4702,7528142386663912287,944619266928306927;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Chapter unlocked by other tasks');
  await expect.soft(itemTitleLocator).toBeVisible();
  await itemContentPage.checksIsChapterLockedMessageVisible();
});

test('check the temp user is not connected to activity', async ({ page }) => {
  await page.goto('a/6747343693587333585;p=4702,7528142386663912287,944619266928306927;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Non-visible task');
  await expect.soft(itemTitleLocator).toBeVisible();
  await expect.soft(page.getByText('You are not connected and cannot start this activity.')).toBeVisible();
  await expect.soft(
    page.getByText('Please sign up or log in using the power button at the top right corner of this screen.')
  ).toBeVisible();
});

test('check the auth user has no access rights to activity', async ({ page, itemContentPage }) => {
  await initAsTesterUser(page);
  await page.goto('a/6747343693587333585;p=4702,7528142386663912287,944619266928306927;pa=0');
  const itemTitleLocator = page.getByTestId('item-title').getByText('Non-visible task');
  await expect.soft(itemTitleLocator).toBeVisible();
  await itemContentPage.checksTaskNoAccessMessageIsVisible();
});
