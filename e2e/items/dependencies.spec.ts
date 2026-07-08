import { test, expect, Page } from '@playwright/test';
import { initAsTesterUser, initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const dependentItemId = '7523720120450464843';
const prerequisiteItemId = '6379723280369399253';
const prerequisiteTitle = 'Blockly Basic Task';
const requiredScore = 42;
const dependenciesUrl = `/a/${dependentItemId};p=7528142386663912287;pa=0/dependencies`;

function prerequisiteRow(page: Page, title: string) {
  return page.locator('.list-item').filter({
    has: page.getByRole('link', { name: title }),
    hasText: 'Required score:',
  });
}

async function removePrerequisiteIfPresent(page: Page): Promise<void> {
  const row = prerequisiteRow(page, prerequisiteTitle);
  if (await row.count() === 0) {
    return;
  }
  await Promise.all([
    page.waitForResponse(response =>
      response.url().includes(`/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`)
      && response.request().method() === 'DELETE'
      && response.ok(),
    ),
    row.getByRole('button', { name: 'Remove prerequisite' }).click(),
  ]);
}

test('empty dependencies and prerequisites', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;pa=0/dependencies');
  await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Add a new prerequisite' })).toBeVisible();
  await expect.soft(page.getByText('There are no other content (visible to you) which depends on this one to unlock')).toBeVisible();
});

test('error/retry on dependencies/prerequisites services', async ({ page }) => {
  await test.step('test error', async () => {
    await page.route(`${apiUrl}/items/7523720120450464843/prerequisites`, route => route.abort());
    await page.route(`${apiUrl}/items/7523720120450464843/dependencies`, route => route.abort());
    await initAsTesterUser(page);
    await page.goto('/a/7523720120450464843;p=7528142386663912287;pa=0/dependencies');
    await expect.soft(page.getByText('Unable to load the prerequisites')).toBeVisible();
    await expect.soft(page.getByText('Unable to load the dependencies')).toBeVisible();
  });
  await test.step('test retry', async () => {
    await page.unroute(`${apiUrl}/items/7523720120450464843/prerequisites`);
    await page.getByRole('button', { name: 'Retry to load prerequisites' }).click();
    await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();
    await page.unroute(`${apiUrl}/items/7523720120450464843/dependencies`);
    await page.getByRole('button', { name: 'Retry to load dependencies' }).click();
    await expect.soft(page.getByText('There are no other content')).toBeVisible();
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

test('adds a prerequisite with a required score', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto(dependenciesUrl);
  await removePrerequisiteIfPresent(page);
  await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();

  try {
    const addDependencySection = page.locator('alg-add-dependency');
    await addDependencySection.getByRole('textbox', { name: 'Search for existing content' }).fill('Blockly Basic');
    const searchResult = addDependencySection.getByRole('listitem').filter({ hasText: prerequisiteTitle });
    await expect.soft(searchResult).toBeVisible();
    await searchResult.getByRole('button', { name: 'Add' }).click();

    const dialog = page.locator('alg-add-prerequisite-dialog');
    await expect.soft(dialog.getByText('Add a prerequisite')).toBeVisible();
    await dialog.getByLabel('Required score (0 to 100)').fill(String(requiredScore));

    const createRequest = page.waitForRequest(request =>
      request.url().includes(`/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`)
      && request.method() === 'POST',
    );
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes(`/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`)
        && response.request().method() === 'POST'
        && response.ok(),
      ),
      dialog.getByRole('button', { name: 'Add prerequisite' }).click(),
    ]);

    expect.soft((await createRequest).postDataJSON()).toEqual({
      grant_content_view: true,
      score: requiredScore,
    });

    const row = prerequisiteRow(page, prerequisiteTitle);
    await expect.soft(row.getByText(`Required score: ${requiredScore}`)).toBeVisible();
  } finally {
    await removePrerequisiteIfPresent(page);
    await expect.soft(page.getByText('There are no prerequisites')).toBeVisible();
  }
});
