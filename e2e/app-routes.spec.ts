import { test, expect, Page } from '@playwright/test';

async function expect404Message(page: Page): Promise<void> {
  await expect.soft(page.getByText('Oops… We didn’t find that page')).toBeVisible();
  await page.getByRole('link', { name: 'Back to home page' }).click();
  await expect.soft(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  await expect.soft(page).toHaveURL(new RegExp('/a/home;pa=0'));
}

test('global not existing page', async ({ page }) => {
  await page.goto('/notexisting');
  await expect404Message(page);
});

test('activity without param', async ({ page }) => {
  await page.goto('/a');
  await expect404Message(page);
});

test('skill without param', async ({ page }) => {
  await page.goto('/s');
  await expect404Message(page);
});

test('groups without param', async ({ page }) => {
  await page.goto('groups');
  await expect404Message(page);
});
