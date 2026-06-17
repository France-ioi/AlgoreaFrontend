import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const activityRootUrl = /\/a\/home/;
const activityDescendantUrl = /\/a\/4102;p=4702/;
const skillRootUrl = /\/s\/3000/;
const skillDescendantUrl = /\/s\/3001;p=3000/;

async function gotoItem(page: import('@playwright/test').Page, url: string, itemId: string): Promise<void> {
  await Promise.all([
    page.waitForResponse(resp => resp.url().startsWith(`${apiUrl}/items/${itemId}`) && resp.ok()),
    page.goto(url),
  ]);
}

test.describe('left menu item tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await initAsTesterUser(page);
  });

  test('clicking the Content tab while on an activity descendant resets to the tab root', async ({ page, leftMenu }) => {
    await gotoItem(page, '/a/4102;p=4702;pa=0', '4102');
    await expect(page).toHaveURL(activityDescendantUrl);

    await leftMenu.clickTab('Content');
    await expect(page).toHaveURL(activityRootUrl);
    await leftMenu.checksTabIsActive('Content');
  });

  test('clicking the Skills tab after leaving skills restores the last descendant selection', async ({ page, leftMenu }) => {
    await gotoItem(page, '/s/3001;p=3000;a=0', '3001');
    await expect(page.getByRole('heading', { name: 'Depth First Search (DFS)' })).toBeVisible();

    await leftMenu.clickTab('Content');
    await expect(page).toHaveURL(activityRootUrl);

    await leftMenu.clickTab('Skills');
    await expect(page).toHaveURL(skillDescendantUrl);
    await expect(page.getByRole('heading', { name: 'Depth First Search (DFS)' })).toBeVisible();
    await leftMenu.checksTabIsActive('Skills');
  });

  test('clicking the Skills tab from activities opens the skills tab root when no descendant was selected', async ({ page, leftMenu }) => {
    await gotoItem(page, '/a/home;pa=0', '4702');
    await expect(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();

    await leftMenu.clickTab('Skills');
    await expect(page).toHaveURL(skillRootUrl);
    await leftMenu.checksTabIsActive('Skills');
  });
});
