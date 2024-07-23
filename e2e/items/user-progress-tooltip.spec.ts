import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

test('checks user progress tooltip', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/504065524219241180;p=694914435881177216,5,4700,4707,4702,4102,1980584647557587953,39530140456452546;a=0/progress/chapter?watchedGroupId=123456');

  await test.step('checks group progress grid is visible', async () => {
    await expect.soft(page.getByRole('heading', { name: 'Echauffement' })).toBeVisible();
    await page.waitForResponse(`${apiUrl}/groups/123456/user-progress?parent_item_ids=504065524219241180&limit=25`);
    const groupProgressGridLocator = page.locator('alg-group-progress-grid');
    await expect.soft(groupProgressGridLocator).toBeVisible();
  });

  const cellLocator = page.getByTestId('user-progress-tooltip-target');

  await test.step('checks user progress tooltip is visible', async () => {
    await expect.soft(page.getByRole('link', { name: 'usr_5p020x2thuyu' })).toBeVisible();
    const firstCellLocator = cellLocator.first();
    await expect.soft(firstCellLocator).toBeVisible();
    await firstCellLocator.click({ force: true });
    await expect.soft(page.getByText('Time spent')).toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Access' })).toBeVisible();
  });

  await test.step('checks user progress tooltip not started is visible', async () => {
    const notStartedCellLocator = cellLocator.nth(5);
    await expect.soft(notStartedCellLocator).toBeVisible();
    await notStartedCellLocator.click({ force: true });
    await expect.soft(page.getByText('Not started')).toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Access' })).toBeVisible();
  });
});
