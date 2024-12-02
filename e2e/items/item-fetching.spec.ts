import { test, expect } from '@playwright/test';
import { initAsTesterUser, initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

/**
 * Check that the basic item fetching (loading, breadcrumbs, results, ... work as expected)
 */

test('visit an already-started chapter', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');

  await test.step('check breadcrumbs', async () => {
    await expect.soft(page.locator('.breadcrumb-list li:nth-child(1)')).toContainText('Algorea Testing Content for devs');
    await expect.soft(page.locator('.breadcrumb-list li:nth-child(3)')).toContainText('Tasks Showcase');
  });

  await test.step('check content', async () => {
    await expect.soft(page.locator('h1.item-title')).toContainText('Tasks Showcase');
    await expect(page.locator('.right-container').getByText('Blockly Basic Task')).toBeVisible();
  });
});

test('wrong path auto-healing', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=404;a=0');

  await test.step('check content', async () => {
    await expect.soft(page.locator('h1.item-title')).toContainText('Tasks Showcase');
  });
});

test('refresh when observation change (check the score)', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/1293400563985240032;p=7528142386663912287,7523720120450464843;a=0?watchedGroupId=752024252804317630&watchUser=1');

  await test.step('check score of the observed user', async () => {
    await expect.soft(page.locator('.score-caption')).toContainText('50');
  });

  await page.locator('alg-observation-bar').filter({ hasText: 'usr_5p020x2thuyu' }).getByRole('button').click();

  await test.step('check score of the current user', async () => {
    await expect.soft(page.locator('.score-caption')).toContainText('75');
  });
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

