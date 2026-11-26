import { expect, Page, test } from 'e2e/items/fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { LeftMenu } from 'e2e/common/pages/left-menu';
import {
  mockTestTaskItemApi,
  routeTestTaskAssets,
  TEST_TASK_ITEM_ID,
  TestTaskPage,
} from 'e2e/items/pages/test-task-page';

// autoHeight makes the test task report itself as full frame; savesHistory lets Events & Edits load it from History.
const fullFrameTaskQuery = 'apiVersion=3&minApiVersion=1&savesHistory=1&autoHeight=1';
const otherFullFrameTaskId = '9999999999999999002';

async function expectNormalLayout(page: Page, leftMenu: LeftMenu, menu: 'open' | 'collapsed'): Promise<void> {
  await expect(page.locator('alg-item-header')).toBeVisible();
  await expect(page.locator('alg-item-by-id alg-tab-bar')).toBeVisible();
  await expect(page.locator('alg-content-top-bar alg-tab-bar')).toHaveCount(0);
  if (menu === 'open') await leftMenu.checksLeftMenuShellIsVisible();
  else await leftMenu.checksLeftMenuIsCollapsed();
}

async function expectFullFrameLayout(page: Page, leftMenu: LeftMenu, menu: 'open' | 'collapsed'): Promise<void> {
  await expect(page.locator('alg-item-header')).toHaveCount(0);
  await expect(page.locator('alg-item-by-id alg-tab-bar')).toHaveCount(0);
  await expect(page.locator('alg-content-top-bar alg-tab-bar')).toBeVisible();
  if (menu === 'open') await leftMenu.checksLeftMenuShellIsVisible();
  else await leftMenu.checksLeftMenuIsCollapsed();
}

test.describe('full-frame task layout', () => {
  let testTaskPage: TestTaskPage;
  let leftMenu: LeftMenu;

  test.beforeEach(async ({ page }) => {
    await initAsUsualUser(page);
    await routeTestTaskAssets(page);
    await mockTestTaskItemApi(page, { taskQuery: fullFrameTaskQuery });
    await page.route(`${apiUrl}/items/${TEST_TASK_ITEM_ID}/log*`, route => route.fulfill({ json: [] }));
    testTaskPage = new TestTaskPage(page);
    leftMenu = new LeftMenu(page);
  });

  test('keeps the normal layout on History and other tabs, and enters full frame on a task tab', async ({ page }) => {
    await page.goto(`/a/${TEST_TASK_ITEM_ID};p=;a=0/history`);
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    await expectNormalLayout(page, leftMenu, 'open');

    const selection = page.getByTestId('selection-control-value');
    await selection.filter({ hasText: 'Events & Edits' }).click();
    await testTaskPage.waitForCall('task.getMetaData');
    await testTaskPage.waitForCall('task.getHistory');
    await expect(page.locator('.item-title-caption').first()).toContainText('Manual');
    await expectNormalLayout(page, leftMenu, 'open');

    await selection.filter({ hasText: 'Events only' }).click();
    await expectNormalLayout(page, leftMenu, 'open');

    await page.getByRole('link', { name: 'Attempts' }).click();
    await expect(page).toHaveURL(/\/attempts/);
    await expectNormalLayout(page, leftMenu, 'open');

    await page.getByRole('link', { name: 'Statement' }).click();
    await expect(page).toHaveURL(/\/task\/task/);
    await expectFullFrameLayout(page, leftMenu, 'collapsed');

    await test.step('a manual reopen survives a round trip through History', async () => {
      await leftMenu.expandLeftMenu();
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page).toHaveURL(/\/history/);
      await expectNormalLayout(page, leftMenu, 'open');
      await page.getByRole('link', { name: 'Statement' }).click();
      await expect(page).toHaveURL(/\/task\/task/);
      await expectFullFrameLayout(page, leftMenu, 'open');
    });
  });

  test('leaving Content keeps the menu hidden and restores the header and in-page tab bar', async ({ page }) => {
    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();
    await expectFullFrameLayout(page, leftMenu, 'collapsed');

    await page.getByRole('link', { name: 'History' }).click();
    await expect(page).toHaveURL(/\/history/);
    await expectNormalLayout(page, leftMenu, 'collapsed');
  });

  test('hides the menu again when opening a different full-frame task', async ({ page }) => {
    await mockTestTaskItemApi(page, { itemId: otherFullFrameTaskId, taskQuery: fullFrameTaskQuery });

    await testTaskPage.gotoItem();
    await testTaskPage.waitForLoaded();
    await expectFullFrameLayout(page, leftMenu, 'collapsed');
    await leftMenu.expandLeftMenu();

    await testTaskPage.clickOpenUrl(otherFullFrameTaskId);
    await expect(page).toHaveURL(new RegExp(otherFullFrameTaskId));
    await testTaskPage.waitForLoaded();
    await expectFullFrameLayout(page, leftMenu, 'collapsed');
  });
});
