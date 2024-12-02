import { test, expect } from '@playwright/test';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test('checks when going to our own user page, it does not show observation', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/users/4038740586962046790/personal-data');
  await expect.soft(page.getByRole('heading', { name: 'e2e-tests' })).toBeVisible();
  await expect.soft(page.locator('alg-observation-bar')).not.toBeVisible();
});

test('checks when going to a group we can observe - observation is enabled', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/1617087077976582412;p=');
  await expect.soft(page.locator('alg-observation-bar').getByText('E2E_Can_Observe')).toBeVisible();
});

test('checks when switch group, observation is changed to that new group', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/1617087077976582412;p=');
  await expect.soft(page.locator('alg-observation-bar').getByText('E2E_Can_Observe')).toBeVisible();
  await expect.soft(page.locator('p-treenode').getByText('E2E_Can_Observe_2')).toBeVisible();
  await page.locator('p-treenode').getByText('E2E_Can_Observe_2').click();
  await expect.soft(page.locator('alg-observation-bar').getByText('E2E_Can_Observe_2')).toBeVisible();
});

test('checks when going to a group we cannot observe from a group we can observe - observation is disabled', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/2832606326718841642;p=');
  await expect.soft(page.getByRole('heading', { name: 'E2E_Can\'t_Observe' })).toBeVisible();
  await expect.soft(page.locator('alg-observation-bar')).not.toBeVisible();
});

test('checks when going to a user page, there is observation mode on that user', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/users/752024252804317630/personal-data');
  await expect.soft(page.getByRole('heading', { name: 'usr_5p020x2thuyu' })).toBeVisible();
  await expect.soft(page.locator('alg-observation-bar').getByText('usr_5p020x2thuyu')).toBeVisible();
});
