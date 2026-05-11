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
  // Description previews render inside a sandboxed iframe; cross the boundary with `contentFrame`.
  const previewFrame = page.locator('alg-preview-html iframe').contentFrame();
  await expect.soft(previewFrame.getByText('Some content')).toBeVisible();
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
  const previewFrame = page.locator('alg-preview-html iframe').contentFrame();
  await expect.soft(previewFrame.locator('strong')).toHaveText('Some content');
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

// Author-provided JS must run inside the iframe AND must not be able to reach the parent (opaque origin sandbox).
test('runs author scripts in the iframe and blocks access to the parent document', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  await expect.soft(page.getByText('Description')).toBeVisible();
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();

  const script = [
    '<p id="alg-test-runs">before</p>',
    '<p id="alg-test-parent"></p>',
    '<script>',
    '  document.getElementById("alg-test-runs").textContent = "after";',
    '  try { document.getElementById("alg-test-parent").textContent = "ok:" + parent.document.title; }',
    '  catch (e) { document.getElementById("alg-test-parent").textContent = "blocked:" + e.name; }',
    '</script>',
  ].join('');
  await editItemDescriptionLocator.getByRole('textbox').fill(script);

  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();

  const previewFrame = page.locator('alg-preview-html iframe').contentFrame();
  await expect.soft(previewFrame.locator('#alg-test-runs')).toHaveText('after');
  // Cross-origin parent access must throw; we don't pin the exact error name across browsers.
  await expect.soft(previewFrame.locator('#alg-test-parent')).toHaveText(/^blocked:/);
});
