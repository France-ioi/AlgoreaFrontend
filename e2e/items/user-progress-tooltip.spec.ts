import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

test('checks user progress tooltip', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter?watchedGroupId=4462192261130512818');

  await test.step('checks group progress grid is visible', async () => {
    await expect.soft(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
    await page.waitForResponse(`${apiUrl}/groups/4462192261130512818/user-progress?parent_item_ids=7523720120450464843&limit=25`);
    const groupProgressGridLocator = page.locator('alg-group-progress-grid');
    await expect.soft(groupProgressGridLocator).toBeVisible();
  });

  const cellLocator = page.getByTestId('user-progress-tooltip-target');

  await test.step('checks user progress tooltip is visible', async () => {
    await expect.soft(page.getByRole('link', { name: 'Armelle Bonenfant (arbonenfant)' })).toBeVisible();
    const firstCellLocator = cellLocator.first();
    await expect.soft(firstCellLocator).toBeVisible();
    await firstCellLocator.click({ force: true });
    await expect.soft(page.getByText('time spent:')).toBeVisible();
    await expect.soft(page.getByText('hints requested:')).toBeVisible();
    await expect.soft(page.getByText('submissions:')).toBeVisible();
    await expect.soft(page.getByText('last activity:')).toBeVisible();
    await expect.soft(page.getByText('average score:')).not.toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Access' })).toBeVisible();
  });

  await test.step('checks user progress tooltip not started is visible', async () => {
    await page.goto('/a/504065524219241180;p=694914435881177216,5,4700,4707,4702,4102,1980584647557587953,39530140456452546;a=0/progress/chapter?watchedGroupId=123456');
    await expect.soft(page.getByRole('heading', { name: 'Echauffement' })).toBeVisible();
    await page.waitForResponse(`${apiUrl}/groups/123456/user-progress?parent_item_ids=504065524219241180&limit=25`);
    const notStartedCellLocator = cellLocator.first();
    await expect.soft(notStartedCellLocator).toBeVisible();
    await notStartedCellLocator.click({ force: true });
    await expect.soft(page.getByText('Not started')).toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Access' })).toBeVisible();
  });
});

test('checks group progress tooltip', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/899800937596940136;p=;pa=0/progress/chapter?watchedGroupId=140728183860941974');

  await test.step('checks group progress grid is visible', async () => {
    await expect.soft(page.getByRole('heading', { name: '4LA 1ère année UE Informatique' })).toBeVisible();
    await page.waitForResponse(`${apiUrl}/groups/140728183860941974/user-progress?parent_item_ids=899800937596940136&limit=25`);
    const groupProgressGridLocator = page.locator('alg-group-progress-grid');
    await expect.soft(groupProgressGridLocator).toBeVisible();
  });

  const cellLocator = page.getByTestId('user-progress-tooltip-target');

  await test.step('checks group progress tooltip is visible', async () => {
    await expect.soft(page.getByText('sub-groups')).toBeVisible();
    await page.getByText('sub-groups').click();
    await expect.soft(page.getByRole('link', { name: 'OMD - 2018-2019' })).toBeVisible();
    const firstCellLocator = cellLocator.first();
    await expect.soft(firstCellLocator).toBeVisible();
    await firstCellLocator.click({ force: true });
    await expect.soft(page.getByText('avg time spent:')).toBeVisible();
    await expect.soft(page.getByText('avg hints requested:')).toBeVisible();
    await expect.soft(page.getByText('avg submissions:')).toBeVisible();
    await expect.soft(page.getByText('validation rate:')).toBeVisible();
    await expect.soft(page.getByText('average score:')).toBeVisible();
    await expect.soft(page.getByText('last activity:')).not.toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'Access' })).toBeVisible();
  });
});
