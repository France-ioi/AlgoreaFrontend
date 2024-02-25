import { test, expect } from '@playwright/test';
import { initAsUsualUser } from './e2e_auth';

test('home page loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Algorea Platform' })).toBeVisible();
  // children list
  await expect(page.locator('alg-item-children-list')).toContainText('ALGOREA SERIOUS GAME');
  // left menu
  await expect(page.locator('#nav-1471479157476024035')).toContainText('ALGOREA SERIOUS GAME');
});

test('home page loaded as usual user', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  await expect(page.locator('alg-top-right-menu')).toContainText('arbonenfant');
});

