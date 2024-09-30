import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';

test('check chapter children', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter');
  const firstChildLink = page.locator('alg-chapter-user-progress tbody tr:nth-child(2) a');
  await expect(firstChildLink).toBeVisible();

  await test.step('check the path to child is correctly built', async () => {
    const href = await firstChildLink.getAttribute('href');
    expect(href).toContain('/a/6379723280369399253;p=7528142386663912287,7523720120450464843;pa=0/progress/chapter');
  });
});
