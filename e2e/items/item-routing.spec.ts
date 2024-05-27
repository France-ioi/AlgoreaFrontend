import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

/**
 * Check that the route parameter parsing (and error handling) works as expected
 */

test('activity with full route loads', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('activity with full route by alias loads', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/home');
  await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
});

test('route with missing path heals', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('route with missing path using alias heals', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/algorea--adventure');
  await expect(page.getByRole('heading', { name: 'ALGOREA ADVENTURE' })).toBeVisible();
});

test('route with missing attempt heals', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287');
  await expect(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
});

test('route with missing attempt at root heals', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7528142386663912287;p=');
  await expect(page.getByRole('heading', { name: 'Algorea Testing Content for devs' })).toBeVisible();
});

test('route with missing path and service error', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/7523720120450464843/path-from-root`, route => route.abort());

  await test.step('path solving error', async () => {
    await page.goto('/a/7523720120450464843');
    await expect(page.getByText('Error while loading the item.')).toBeVisible();
  });

  await test.step('back to home page', async () => {
    await page.getByRole('link', { name: 'home page' }).click();
    await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
  });

});

test('route with action parameter: action passed to subcomponents + parameter removed', { tag: '@no-parallelism' }, async ({ page }) => {
  const emptyAnswer = '1970981512988735785';
  const answerWith1234567 = '4143245131838208903';

  await initAsUsualUser(page);
  // first reload an empty answer
  await page.goto(`/a/6379723280369399253;p=;pa=0;answerId=${emptyAnswer};answerLoadAsCurrent=1`);

  await test.step('checks the answer has been emptied', async () => {
    await expect(page.frameLocator('iframe').getByText('Programme de la tortue')).toBeVisible({ timeout: 30000 });
    await expect(page.frameLocator('iframe').getByText('1234567')).not.toBeVisible();
  });

  // then reload a answer which contains "1234567" in the answer
  await page.goto(`/a/6379723280369399253;p=;pa=0;answerId=${answerWith1234567};answerLoadAsCurrent=1`);

  await test.step('drop the action parameter', async () => {
    await expect(page.locator('.left-pane-title-text')).toContainText('Blockly Basic Task', { timeout: 30000 });
    expect(page.url()).toContain('/a/6379723280369399253;p=;pa=0');
    expect(page.url()).not.toContain('answer');
  });

  await test.step('has loaded the expected answer', async () => {
    await expect(page.frameLocator('iframe').getByText('Programme de la tortue')).toBeVisible({ timeout: 30000 });
    await expect(page.frameLocator('iframe').getByText('1234567')).toBeVisible({ timeout: 30000 }); // to check it is the right answer
  });
});
