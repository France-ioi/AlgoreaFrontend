import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

test('task which cannot load its previous answer does not cause the display of the loading error', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/6211720186308979018;p=7528142386663912287,3327328786400474746;a=0');
  await expect(page.getByText('Loading the content')).toBeVisible();
  // make sure that when the loading is over, the error is not displayed
  await expect(page.getByText('Loading the content')).not.toBeVisible();
  await expect(page.getByText('An unknown error occurred')).not.toBeVisible();
});
