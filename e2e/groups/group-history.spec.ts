import { test } from './fixture';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { expect } from '@playwright/test';

test('checks history tab is visible', async ({ page, groupHistoryPage }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/140728183860941974;p=/history');
  await groupHistoryPage.checksIsTableVisible();
});

test('checks history tab is not visible', async ({ page, groupHistoryPage }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/5738025589734638944;p=/history');
  const navTabLocator = page.getByTestId('alg-nav-tab');
  await expect.soft(navTabLocator.getByText('History')).toBeVisible();
  await groupHistoryPage.checksIsForbiddenMessageVisible();
  await navTabLocator.getByText('Overview').click();
  await expect.soft(navTabLocator.getByText('History')).not.toBeVisible();
});

test('checks switch between history tabs', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/home;pa=0/progress/history');
  await page.locator('p-treenode').getByText(' Item Title! ').click();
  await expect.soft(page).toHaveURL('a/6707691810849260111;p=;a=0;pa=0/progress/history');
});
