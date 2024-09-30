import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

// TODO: Tests to be improved to cover empty / non-empty cases, but that would require to improve to clean the dataset first

test('skill loads with activities and parents, no subskills,', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/s/3001;p=3000;a=0');
  await expect.soft(page.getByRole('heading', { name: 'Depth First Search (DFS)' })).toBeVisible();

  await test.step('check subskills', async () => {
    await expect.soft(page.getByText('Sub-skills')).toBeVisible();
    await expect.soft(page.locator('alg-item-children-list').filter({ hasText: 'This skill does not have subskills' })).toBeVisible();
    await expect.soft(page.getByText('Activities to learn or')).toBeVisible();
    await expect.soft(page.locator('alg-sub-skills').getByRole('link', { name: 'Castor 2014' })).toBeVisible();
  });

  await test.step('check parent skills', async () => {
    await expect.soft(page.getByText('Parent skills')).toBeVisible();
    await expect.soft(page.locator('alg-parent-skills').getByRole('link', { name: 'Trees' })).toBeVisible();
  });
});

test('skill loads, with subskills', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/s/3002;p=3000;a=0');

  await test.step('check subskills', async () => {
    await expect.soft(page.getByText('Sub-skills')).toBeVisible();
    await expect.soft(page.locator('alg-sub-skills').getByRole('link', { name: 'Test3' })).toBeVisible();
  });
});

test('skill sub-tables loading errors', async ({ page }) => {
  await page.route(`${apiUrl}/items/3001/parents*`, route => route.abort());
  await page.route(`${apiUrl}/items/3001/children*`, route => route.abort());

  await initAsTesterUser(page);
  await page.goto('/s/3001;p=3000;a=0');
  await expect.soft(page.getByRole('heading', { name: 'Depth First Search (DFS)' })).toBeVisible();

  await test.step('check subskills', async () => {
    await expect.soft(page.locator('alg-sub-skills').getByText('Error while loading content')).toBeVisible();
  });

  await test.step('check parent skills', async () => {
    await expect.soft(page.getByText('Parent skills')).toBeVisible();
    await expect.soft(page.getByText('Error while loading the skill parents')).toBeVisible();
  });
});
