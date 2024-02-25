import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../e2e_auth';

/**
 * Just check the basics of groups
 */

test('"my groups" page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/mine');
  await expect(page.getByRole('heading', { name: 'My groups' })).toBeVisible();
});

test('a group page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/4462192261130512818;p=');
  await expect(page.getByRole('heading', { name: 'AlgoreaDevs' })).toBeVisible();
});

test('a non-existing group page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/404');
  await expect(page.getByText('You are not allowed to view this group page')).toBeVisible();
});

test('another user\'s page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/users/752024252804317630');
  await expect(page.getByRole('heading', { name: 'usr_5p020x2thuyu' })).toBeVisible();
});
