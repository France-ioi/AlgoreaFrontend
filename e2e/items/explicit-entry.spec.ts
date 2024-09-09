import { test, expect } from '@playwright/test';

test('enter explicitely an activity with "content" initial view permission', async ({ page }) => {
  // as temp user
  await page.goto('/a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;pa=0');
  await expect(page.getByText('You can currently start the activity')).toBeVisible();
  await page.getByRole('button', { name: 'Enter now' }).click();

  await expect.soft(page.locator('.right-container').getByText('Some course')).toBeVisible();
  await expect.soft(page.locator('alg-time-limited-content-info')).toBeVisible();
  await expect.soft(page.getByText('2h59')).toBeVisible();
});

test('enter explicitely an activity with "info" initial view permission', async ({ page }) => {
  // as temp user
  await page.goto('/a/851659072357188051;p=4702,7528142386663912287,944619266928306927;pa=0');
  await expect(page.getByText('You can currently start the activity')).toBeVisible();
  await page.getByRole('button', { name: 'Enter now' }).click();

  await expect.soft(page.getByText("This chapter has no content visible to you, so you can't validate it for now.")).toBeVisible();
  await expect.soft(page.locator('alg-time-limited-content-info')).not.toBeVisible();
});

