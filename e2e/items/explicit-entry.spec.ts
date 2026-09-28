import { test, expect } from '@playwright/test';

test('content viewers start explicit-entry activities without enter conditions', async ({ page }) => {
  // Temp user with content view: direct start (bypass enter conditions / duration), not Enter now.
  await page.goto('/a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;pa=0');
  await expect(page.getByText('This content requires manual entry.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this activity without time constraints' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter now' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Start this activity without time constraints' }).click();

  await expect.soft(page.locator('.right-container').getByText('Some course')).toBeVisible();
  // Direct start uses POST /attempts (no duration window), so the timer is not shown.
  await expect.soft(page.locator('alg-time-limited-content-info')).not.toBeVisible();
});

test('enter explicitely an activity with "info" initial view permission', async ({ page }) => {
  // as temp user
  await page.goto('/a/851659072357188051;p=4702,7528142386663912287,944619266928306927;pa=0');
  await expect(page.getByText('You can currently start the activity')).toBeVisible();
  await page.getByRole('button', { name: 'Enter now' }).click();

  await expect.soft(page.getByText("This chapter has no content visible to you, so you can't validate it for now.")).toBeVisible();
  await expect.soft(page.locator('alg-time-limited-content-info')).not.toBeVisible();
});
