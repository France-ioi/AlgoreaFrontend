import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

test('empty dependencies and prerequisites', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;pa=0/dependencies');
  await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Add a new prerequisite' })).toBeVisible();
  await expect.soft(page.getByText('There are no other content (visible to you) which depends on this one to unlock')).toBeVisible();
});

test('error/retry on dependencies/prerequisites services', async ({ page }) => {
  await test.step('test error', async () => {
    await page.route(`${apiUrl}/items/7523720120450464843/prerequisites`, route => route.abort());
    await page.route(`${apiUrl}/items/7523720120450464843/dependencies`, route => route.abort());
    await initAsUsualUser(page);
    await page.goto('/a/7523720120450464843;p=7528142386663912287;pa=0/dependencies');
    await expect.soft(page.getByText('Unable to load the dependencies')).toBeVisible(); // TODO: should be "prerequisites"
    // TODO: There is no proper error messages when the dependencies service fails
  });
  await test.step('test retry', async () => {
    await page.unroute(`${apiUrl}/items/7523720120450464843/prerequisites`);
    await page.getByRole('button', { name: 'Retry' }).click(); // TODO make it more specific to press the right one
    await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();
    // TODO: test retry on dependencies as well
  });
});

test('non-empty prerequisites', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/3313249091411426159;p=7528142386663912287,944619266928306927;a=0/dependencies');
  await expect.soft(page.getByText('Users will unlock access to')).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'Chapter with a dependency' })).toBeVisible();
});

test('non-empty dependencies', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/4120671243898027313;p=7528142386663912287,944619266928306927;a=0/dependencies');
  await expect.soft(page.getByRole('link', { name: 'Chapter with a prerequisite' })).toBeVisible();
});
