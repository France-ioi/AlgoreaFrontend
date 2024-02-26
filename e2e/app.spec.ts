import { test, expect } from '@playwright/test';
import { initAsUsualUser } from './helpers/e2e_auth';
import { apiUrl } from './helpers/e2e_http';

test('home page loaded', async ({ page }) => {
  await page.goto('/');
  await expect.soft(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'Algorea Platform' })).toBeVisible();

  await test.step('check children list', async () => {
    await expect.soft(page.locator('alg-item-children-list')).toContainText('ALGOREA SERIOUS GAME');
  });

  await test.step('check left menu', async () => {
    await expect(page.locator('#nav-1471479157476024035')).toContainText('ALGOREA SERIOUS GAME');
  });
});

test('home page loaded as usual user', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/');
  await expect.soft(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  await expect.soft(page.locator('alg-top-right-menu')).toContainText('arbonenfant');
});

test('backend is down', async ({ page }) => {
  await page.route(`${apiUrl}/**`, route => {
    route.abort();
  });
  await page.goto('/');
  await expect(page.getByText('Oops, we are unable to make')).toBeVisible();
});
