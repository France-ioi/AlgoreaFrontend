import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

const contentPageUrl = 'a/home;pa=0';
const mainContentHeading = 'Parcours officiels';

test.describe('left menu search', () => {
  test.beforeEach(async ({ page }) => {
    await initAsTesterUser(page);
    await page.goto(contentPageUrl);
    await expect(page.getByRole('heading', { name: mainContentHeading })).toBeVisible();
  });

  test('opening search and returning to Content tab does not change the right content', async ({ page, leftMenu }) => {
    const urlBefore = page.url();

    await test.step('open search leaves right content unchanged', async () => {
      await leftMenu.openSearch();
      await expect(page).toHaveURL(urlBefore);
      await expect(page.getByRole('heading', { name: mainContentHeading })).toBeVisible();
    });

    await test.step('Content tab closes search without changing right content', async () => {
      await leftMenu.clickTab('Content');
      await expect(page).toHaveURL(urlBefore);
      await expect(page.getByRole('heading', { name: mainContentHeading })).toBeVisible();
      await leftMenu.checksTabIsActive('Content');
      await leftMenu.checksIsLeftNavTreeVisible();
      await leftMenu.checksSearchPanelNotVisible();
    });
  });

  test('opening search then Groups tab navigates the right content', async ({ page, leftMenu }) => {
    const urlBefore = page.url();

    await leftMenu.openSearch();
    await expect(page).toHaveURL(urlBefore);

    await leftMenu.clickTab('Groups');
    await expect(page).not.toHaveURL(urlBefore);
    await expect(page).toHaveURL(/\/groups/);
    await expect(page.getByRole('heading', { name: 'My groups' })).toBeVisible();
    await leftMenu.checksTabIsActive('Groups');
  });

  test('opening search then closing with X restores Content tab without changing right content', async ({ page, leftMenu }) => {
    const urlBefore = page.url();

    await leftMenu.openSearch();
    await expect(page).toHaveURL(urlBefore);

    await leftMenu.closeSearchWithX();
    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByRole('heading', { name: mainContentHeading })).toBeVisible();
    await leftMenu.checksTabIsActive('Content');
    await leftMenu.checksIsLeftNavTreeVisible();
  });

  test('searching for motif shows results in the left panel', async ({ page, leftMenu }) => {
    await leftMenu.openSearch();
    await leftMenu.searchFor('motif');
    await leftMenu.checksHasSearchResults();
  });
});
