import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';

/**
 * Just check the basics of items
 */

test('activity loads', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('item loads with path missing', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('item loads with invalid path', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=404;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});
