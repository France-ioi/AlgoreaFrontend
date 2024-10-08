import { test, expect } from '@playwright/test';
import { initAsTesterUser, initAsUsualUser } from '../helpers/e2e_auth';

test('checks no access message', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('a/1625159049301502151;p=4702;a=0/parameters');
  await expect.soft(page.getByText('You do not have the permissions to edit this content.')).toBeVisible();
});

test('checks edit parameters components are visible', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/6707691810849260111;p=;a=0/parameters');
  await expect.soft(page.getByText('Information')).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Information' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Description' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Score & Validation' })).toBeVisible();
});
