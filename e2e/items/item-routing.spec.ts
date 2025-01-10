import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

/**
 * Check that the route parameter parsing (and error handling) works as expected
 */

test('activity with full route loads', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('activity with full route by alias loads', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/home');
  await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
});

test('route with missing path heals', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('route with missing path using alias heals', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/algorea--adventure');
  await expect(page.getByRole('heading', { name: 'ALGOREA ADVENTURE' })).toBeVisible();
});

test('route with missing attempt heals', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('route with missing attempt at root heals', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7528142386663912287;p=');
  await expect(page.getByRole('heading', { name: 'Algorea Testing Content for devs' })).toBeVisible();
});

test('route with missing path and service error', async ({ page }) => {
  await initAsTesterUser(page);
  await page.route(`${apiUrl}/items/7523720120450464843/path-from-root`, route => route.abort());

  await test.step('path solving error', async () => {
    await page.goto('/a/7523720120450464843');
    await expect(page.getByText('Error while loading the item.')).toBeVisible();
  });

  await test.step('back to home page', async () => {
    await page.getByRole('link', { name: 'home page' }).click();
    await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  });

});
