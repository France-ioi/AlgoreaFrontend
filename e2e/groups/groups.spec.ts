import { test, expect } from './fixture';
import { initAsUsualUser } from '../helpers/e2e_auth';

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

test('checks "Groups" as temp user', async ({ page, minePage }) => {
  await test.step('checks "Groups" tab in left menu as temp user', async () => {
    await minePage.goto();
    await expect.soft(page.getByRole('button', { name: 'Groups' })).toBeVisible();
  });

  await test.step('checks "My Groups" non auth message', async () => {
    await minePage.checkHeaderIsVisible();
    await minePage.checkHeaderSubtitleIsVisible();
    await minePage.checksNonAuthMessageIsVisible();
  });
});
