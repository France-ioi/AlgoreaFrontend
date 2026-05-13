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

test('opens the description help tab and shows guidance about links', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await expect.soft(tabsLocator).toBeVisible();
  await tabsLocator.getByRole('button', { name: 'Help' }).click();
  const helpLocator = page.getByTestId('edit-item-description-help');
  await expect.soft(helpLocator).toBeVisible();
  await expect.soft(helpLocator.getByRole('heading', { name: 'Creating links' })).toBeVisible();
  await expect.soft(helpLocator).toContainText('data-item-id');
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

// Regression for the v2 messaging protocol: in `srcdoc` iframes, an unintercepted hash click
// navigates to `about:srcdoc#name` and blanks the iframe (especially visible in Firefox). The
// runtime helper must intercept hash anchors (resolving the target by `id` or legacy `name`)
// and ask the parent to scroll, rather than letting the browser default through.
test('keeps the iframe rendered when a hash anchor is clicked and resolves <a name=…> targets', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();
  await editItemDescriptionLocator.getByRole('textbox').fill([
    '<a id="alg-test-jump" href="#alg-test-target">jump</a>',
    '<div style="height:1500px"></div>',
    // legacy name attribute (the bug report used this exact form)
    '<a name="alg-test-target">target</a>',
  ].join(''));

  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();

  const previewFrame = page.locator('alg-preview-html iframe').contentFrame();
  await expect.soft(previewFrame.locator('#alg-test-jump')).toBeVisible();

  await previewFrame.locator('#alg-test-jump').click();

  // The bug being guarded against: the iframe document gets replaced by `about:srcdoc#…` and the
  // body becomes empty. Both anchors must still be in the DOM after the click.
  await expect.soft(previewFrame.locator('#alg-test-jump')).toHaveText('jump');
  await expect.soft(previewFrame.locator('a[name=alg-test-target]')).toHaveText('target');
});

// Plain `<a href="https://…">` would otherwise navigate the iframe document itself under
// `sandbox="allow-scripts"` (no popups, no top-frame nav). The helper must intercept and route
// through the parent — the preview surface surfaces it as a toast.
test('does not navigate the iframe away when a plain http href is clicked, and surfaces a toast', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/3244687538937221949;p=;a=0/parameters');
  const editItemDescriptionLocator = page.getByTestId('edit-item-description');
  await expect.soft(editItemDescriptionLocator).toBeVisible();
  await editItemDescriptionLocator.getByRole('textbox')
    .fill('<a id="alg-test-ext" href="https://example.test/whatever">go</a>');

  const tabsLocator = page.getByTestId('edit-item-description-tabs');
  await tabsLocator.getByRole('button', { name: 'Preview' }).click();

  const previewFrame = page.locator('alg-preview-html iframe').contentFrame();
  await expect.soft(previewFrame.locator('#alg-test-ext')).toBeVisible();

  await previewFrame.locator('#alg-test-ext').click();

  // Iframe still rendering the original anchor — i.e. it did NOT navigate to example.test.
  await expect.soft(previewFrame.locator('#alg-test-ext')).toHaveText('go');

  // Preview surface translates `alg.navigate { url }` into an info toast.
  await expect.soft(page.locator('alg-toast-messages .message-text'))
    .toContainText('https://example.test/whatever');
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
