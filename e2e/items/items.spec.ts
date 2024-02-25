import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../e2e_auth';

/**
 * Just check the basics of items
 */

test('activity loads', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('skill loads', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/s/3001;p=3000;a=0');
  await expect(page.getByRole('heading', { name: 'Depth First Search (DFS)' })).toBeVisible();
  await expect(page.getByText('Sub-skills')).toBeVisible();
  await page.getByText('Activities to learn or').click();
  await expect(page.getByText('Parent skills')).toBeVisible();
});

test('item loads with path missing', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('item loads with invalid path', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=404;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});
