import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

test('check chapter children as a grid', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/9151590357867554022;p=7528142386663912287,6621899821435600308;a=0');
  const firstChildLink = page.locator('alg-chapter-children > div > div:first-child > a');
  await expect(firstChildLink).toBeVisible();

  await test.step('check the path to child is correctly built', async () => {
    const href = await firstChildLink.getAttribute('href');
    expect(href).toContain('/a/7160584978827224142;p=7528142386663912287,6621899821435600308,9151590357867554022;pa=0');
  });
});
