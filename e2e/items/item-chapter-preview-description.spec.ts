import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';

test('checks simple text description preview', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  await expect.soft(page.getByText('Description')).toBeVisible();
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();
  await editItemDescriptionLocator.getByRole('textbox').fill('Some content');
  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await expect.soft(tabsLocator).toBeVisible();
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();
  await expect.soft(page.locator('alg-preview-html')).toHaveText('Some content');
});

test('checks html description preview', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  await expect.soft(page.getByText('Description')).toBeVisible();
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();
  await editItemDescriptionLocator.getByRole('textbox').fill('<strong>Some content</strong>');
  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await expect.soft(tabsLocator).toBeVisible();
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();
  await expect.soft(page.locator('alg-preview-html').locator('strong')).toHaveText('Some content');
});

test('checks no preview description', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  await expect.soft(page.getByText('Description')).toBeVisible();
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();
  await editItemDescriptionLocator.getByRole('textbox').fill('');
  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await expect.soft(tabsLocator).toBeVisible();
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();
  await expect.soft(page.locator('alg-preview-html')).toHaveText('Nothing to preview');
});
