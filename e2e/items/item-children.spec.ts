import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

test('check chapter children as a list', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');
  const firstChildLink = page.locator('alg-item-children-list > ul > li:first-child > a');
  await expect(firstChildLink).toBeVisible();

  await test.step('check the path to child is correctly built', async () => {
    const href = await firstChildLink.getAttribute('href');
    expect(href).toContain('/a/6379723280369399253;p=7528142386663912287,7523720120450464843;a=0');
  });
});
