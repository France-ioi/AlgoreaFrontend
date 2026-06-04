import { expect, test } from 'e2e/common/fixture';
import { mockConfig } from 'e2e/assets/mock-config';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { neighborNextButton, neighborWidgetLocator } from 'e2e/helpers/neighbor-widget';

const hiddenTreeItemId = '6390082892422125257';
const nextCompactTreeItemId = '7143408445463448320';
const parentItemId = '6621899821435600308';
const pathToHiddenItem = '4702,7528142386663912287,6621899821435600308';
const hiddenItemUrl = `/a/${hiddenTreeItemId};p=${pathToHiddenItem};a=0`;
const hiddenItemUrlWithParentAttempt = `${hiddenItemUrl};pa=0`;
const parentItemUrl = `/a/${parentItemId};p=4702,7528142386663912287;a=0`;

const hiddenTreeChildTitle = /hidden left menu content/;

test.describe('left menu compact tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('*/**/assets/config.js', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.appConfig=${JSON.stringify(mockConfig)}`,
      });
    });
    await initAsTesterUser(page);
  });

  test('direct navigation to configured item shows compact left menu width', async ({ page, leftMenu }) => {
    await page.goto(hiddenItemUrl);
    await expect(page).toHaveURL(new RegExp(`/a/${hiddenTreeItemId}`));
    await leftMenu.checksIsLeftMenuVisible();
    await leftMenu.checksIsCompactTreeMode();
  });

  test('navigating from parent to configured child switches to compact left menu width', async ({ page, leftMenu }) => {
    await page.goto(parentItemUrl);
    await expect(page).toHaveURL(new RegExp(`/a/${parentItemId}`));
    await leftMenu.checksIsFullTreeMode();

    await leftMenu.navigateToHiddenTreeChild(hiddenTreeChildTitle, hiddenTreeItemId);
    await expect(page).toHaveURL(new RegExp(`/a/${hiddenTreeItemId}`));
    await leftMenu.checksIsCompactTreeMode();
  });

  test('search expands compact menu on configured chapter and closing search recollapses it', async ({ page, leftMenu }) => {
    await page.goto(hiddenItemUrl);
    await expect(page).toHaveURL(new RegExp(`/a/${hiddenTreeItemId}`));

    await test.step('chapter starts with compact left menu', async () => {
      await leftMenu.checksIsLeftMenuVisible();
      await leftMenu.checksIsCompactTreeMode();
    });

    await test.step('pressing search opens the full left menu with search panel', async () => {
      await leftMenu.clickTab('Search');
      await leftMenu.checksLeftMenuIsExpandedForSearch();
    });

    await test.step('closing search recollapses the left menu to tab-bar width', async () => {
      await leftMenu.closeSearchWithX();
      await leftMenu.checksIsCompactTreeMode();
    });
  });

  test('navigating to next compact sibling via top-right neighbor keeps compact left menu width', async ({ page, leftMenu }) => {
    await page.goto(hiddenItemUrlWithParentAttempt);
    await expect(page).toHaveURL(new RegExp(`/a/${hiddenTreeItemId}`));

    await test.step('first compact chapter shows compact left menu', async () => {
      await leftMenu.checksIsCompactTreeMode();
    });

    await test.step('next neighbor navigates to the other compact chapter', async () => {
      const widget = neighborWidgetLocator(page);
      await expect(neighborNextButton(widget)).toBeVisible();
      await neighborNextButton(widget).click();
      await expect(page).toHaveURL(new RegExp(`/a/${nextCompactTreeItemId}`));
    });

    await test.step('second compact chapter still shows compact left menu', async () => {
      await leftMenu.checksIsCompactTreeMode();
    });
  });

  test('collapsing compact left menu gives full width to main content', async ({ page, leftMenu }) => {
    await page.goto(hiddenItemUrl);
    await leftMenu.checksIsCompactTreeMode();

    await leftMenu.collapseLeftMenu();
    await leftMenu.checksLeftMenuIsCollapsed();
  });
});
