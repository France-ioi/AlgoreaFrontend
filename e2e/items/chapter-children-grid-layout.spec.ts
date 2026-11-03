import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { rootItemId } from 'e2e/items/create-item-fixture';
import {
  clearHostWidth,
  compactCapPx,
  compactGapPx,
  compactRowMaxPx,
  ensureLeftMenuExpanded,
  expectEqualFillingTracks,
  expectFixedCapTracks,
  normalCapPx,
  readGridMetrics,
  setHostWidth,
  setThreadMarginReserved,
  trackCount,
} from './chapter-children-grid-metrics';

/** Existing Grid chapter used by chapter-children.spec.ts */
const gridChapterUrl = '/a/9151590357867554022;p=7528142386663912287,6621899821435600308;a=0';

test.describe('chapter children grid layout', () => {
  test.beforeEach(async ({ page }) => {
    await initAsUsualUser(page);
    // Wide enough that viewport steps already choose 4 normal / 6 compact columns.
    await page.setViewportSize({ width: 1800, height: 1000 });
  });

  test('normal grid adds columns from grid width, then caps at 265px', async ({ page, leftMenu }) => {
    await page.goto(gridChapterUrl);
    const host = page.locator('alg-chapter-children alg-chapter-children-grid').first();
    await expect(host.locator('.grid-item').first()).toBeVisible();

    await test.step('medium window keeps the 3-column viewport step', async () => {
      await page.setViewportSize({ width: 1200, height: 900 });
      await clearHostWidth(host);
      await ensureLeftMenuExpanded(leftMenu, page);
      // With left menu: 4 columns start at 1400px viewport; at 1200 expect 3.
      await expect.poll(async () => trackCount(host, '.grid-item')).toBe(3);
      await page.setViewportSize({ width: 1800, height: 1000 });
    });

    await test.step('just wider than 1108px shows 5 equal filling columns ≤ 265px', async () => {
      await setHostWidth(host, 1109);
      await expect.poll(async () => trackCount(host, '.grid-item')).toBe(5);
      const metrics = await readGridMetrics(host, '.grid-item');
      expectEqualFillingTracks(metrics, 5);
      expect(metrics.firstTileWidth!).toBeLessThanOrEqual(normalCapPx + 1);
    });

    await test.step('just wider than 1389px shows 6 equal filling columns', async () => {
      await setHostWidth(host, 1390);
      await expect.poll(async () => trackCount(host, '.grid-item')).toBe(6);
      const metrics = await readGridMetrics(host, '.grid-item');
      expectEqualFillingTracks(metrics, 6);
      expect(metrics.firstTileWidth!).toBeLessThanOrEqual(normalCapPx + 1);
    });

    await test.step('wider than 1670px keeps 6 tracks at 265px; growing further does not grow the tile', async () => {
      await setHostWidth(host, 1671);
      await expect.poll(async () => trackCount(host, '.grid-item')).toBe(6);
      expectFixedCapTracks(await readGridMetrics(host, '.grid-item'), 6, normalCapPx);

      await setHostWidth(host, 1900);
      expectFixedCapTracks(await readGridMetrics(host, '.grid-item'), 6, normalCapPx);
    });

    await test.step('cap-band tile stays at 265px (one track, does not fill the row)', async () => {
      await setHostWidth(host, 1800);
      const metrics = await readGridMetrics(host, '.grid-item');
      expect(metrics.firstTileWidth!).toBeLessThanOrEqual(normalCapPx + 1);
      expect(Math.abs(metrics.firstTileWidth! - normalCapPx)).toBeLessThan(2);
    });

    await test.step('left menu open/close changes columns from grid width', async () => {
      await clearHostWidth(host);
      await page.setViewportSize({ width: 1600, height: 1000 });

      await ensureLeftMenuExpanded(leftMenu, page);
      await expect.poll(async () => (await readGridMetrics(host, '.grid-item')).hostWidth)
        .toBeLessThan(1400);
      const withMenu = await readGridMetrics(host, '.grid-item');
      await leftMenu.collapseLeftMenu();
      await expect.poll(async () => (await readGridMetrics(host, '.grid-item')).hostWidth)
        .toBeGreaterThan(withMenu.hostWidth);
      const withoutMenu = await readGridMetrics(host, '.grid-item');
      expect(withoutMenu.trackCount).toBeGreaterThanOrEqual(withMenu.trackCount);
      await leftMenu.expandLeftMenu();
    });

    await test.step('right thread margin open/close changes columns from grid width', async () => {
      await clearHostWidth(host);
      await page.setViewportSize({ width: 1900, height: 1000 });
      await leftMenu.collapseLeftMenu();
      await expect.poll(async () => (await readGridMetrics(host, '.grid-item')).hostWidth)
        .toBeGreaterThan(1500);

      await setThreadMarginReserved(page, false);
      const withoutThread = await readGridMetrics(host, '.grid-item');
      await setThreadMarginReserved(page, true);
      await expect.poll(async () => (await readGridMetrics(host, '.grid-item')).hostWidth)
        .toBeLessThan(withoutThread.hostWidth);
      const withThread = await readGridMetrics(host, '.grid-item');
      expect(withThread.trackCount).toBeLessThanOrEqual(withoutThread.trackCount);

      await setThreadMarginReserved(page, false);
      await expect.poll(async () => (await readGridMetrics(host, '.grid-item')).hostWidth)
        .toBeGreaterThan(withThread.hostWidth);
    });
  });
});

test.describe('chapter children compact grid layout', () => {
  test.beforeEach(async ({ page }) => {
    await initAsTesterUser(page);
    await page.setViewportSize({ width: 1800, height: 1000 });
  });

  // Parent keeps nested children, so the usual empty-chapter deleteItem fixture cannot run.
  test('compact grid and placeholder follow 6 then 7–9 with shared 1670px cap row', async ({
    page,
    createItem,
    itemContentPage,
    leftMenu,
  }) => {
    test.setTimeout(90_000);
    if (!createItem) throw new Error('The item is not created');

    const parentId = createItem.itemId;
    const parentParamsUrl = `a/${parentId};p=${rootItemId};pa=0/parameters`;
    const parentContentUrl = `a/${parentId};p=${rootItemId};pa=0`;
    let nestedChapterId: string | undefined;

    await test.step('set TwoLevels layout and add a nested chapter with a grandchild', async () => {
      await Promise.all([
        page.goto(parentParamsUrl),
        itemContentPage.waitForItemResponse(parentId),
      ]);
      const childrenLayoutSelection = page.locator('.form-item-view').filter({ hasText: 'Children layout' }).locator('alg-selection');
      await childrenLayoutSelection.getByTestId('selection-control-value').filter({ hasText: 'Two levels' }).click();
      const itemPut = page.waitForResponse(resp =>
        resp.request().method() === 'PUT'
        && resp.url() === `${apiUrl}/items/${parentId}`
        && resp.request().postData()?.includes('"children_layout":"TwoLevels"') === true
        && resp.ok());
      await Promise.all([ itemPut, itemContentPage.saveChangesAndCheckNotification() ]);

      await Promise.all([
        page.goto(`a/${parentId};p=${rootItemId};pa=0/edit-children`),
        itemContentPage.waitForItemResponse(parentId),
      ]);
      await itemContentPage.waitForChildrenResponse(parentId, 'attempt_id=0&show_invisible_items=1');
      nestedChapterId = await itemContentPage.createChildItem(`E2E_Nested_${Date.now()}`, 'Chapter');
      expect(nestedChapterId).toBeTruthy();

      await Promise.all([
        page.goto(`a/${nestedChapterId};p=${rootItemId},${parentId};pa=0/edit-children`),
        itemContentPage.waitForItemResponse(nestedChapterId!),
      ]);
      await itemContentPage.waitForChildrenResponse(nestedChapterId!, 'attempt_id=0&show_invisible_items=1');
      await itemContentPage.createChildItem(`E2E_Grandchild_${Date.now()}`, 'Chapter');
    });

    const section = page.locator('alg-two-levels-container-section').first();
    const compactHost = section.locator('alg-chapter-children-grid').first();

    await test.step('compact tiles step 7 → 8 → 9 then cap', async () => {
      await page.goto(parentContentUrl);
      await expect(compactHost.locator('.grid-item').first()).toBeVisible({ timeout: 30000 });

      await setHostWidth(compactHost, 1000);
      await expect.poll(async () => trackCount(compactHost, '.grid-item')).toBe(6);

      await setHostWidth(compactHost, 1109);
      await expect.poll(async () => trackCount(compactHost, '.grid-item')).toBe(7);
      expectEqualFillingTracks(await readGridMetrics(compactHost, '.grid-item'), 7);

      await setHostWidth(compactHost, 1296);
      await expect.poll(async () => trackCount(compactHost, '.grid-item')).toBe(8);

      await setHostWidth(compactHost, 1483);
      await expect.poll(async () => trackCount(compactHost, '.grid-item')).toBe(9);

      await setHostWidth(compactHost, 1671);
      await expect.poll(async () => trackCount(compactHost, '.grid-item')).toBe(9);
      expectFixedCapTracks(await readGridMetrics(compactHost, '.grid-item'), 9, compactCapPx);

      const trackSum = (await readGridMetrics(compactHost, '.grid-item')).trackSizesPx
        .reduce((sum, size) => sum + size, 0);
      expect(Math.abs(trackSum + 8 * compactGapPx - compactRowMaxPx)).toBeLessThan(2);
    });

    await test.step('placeholder uses compact column template while grandchildren load', async () => {
      expect(nestedChapterId).toBeTruthy();
      await page.route(`**${apiUrl}/items/*/children**`, async route => {
        const url = route.request().url();
        if (url.includes(`/items/${nestedChapterId}/children`)) {
          await new Promise(resolve => setTimeout(resolve, 2500));
          await route.continue();
          return;
        }
        if (!url.includes(`/items/${parentId}/children`)) {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        const body = await response.json() as { data?: Record<string, unknown>[] } | Record<string, unknown>[];
        const rows = Array.isArray(body) ? body : body.data;
        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (String(row['id']) === nestedChapterId) {
              delete row['children'];
            }
          }
        }
        await route.fulfill({
          status: response.status(),
          headers: { ...response.headers(), 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      });

      await page.goto(parentContentUrl);
      const placeholder = section.locator('.placeholder-grid');
      await expect(placeholder).toBeVisible({ timeout: 30000 });

      await setHostWidth(section, 1000);
      await expect.poll(async () => trackCount(section, '.placeholder-card')).toBe(6);

      await setHostWidth(section, 1109);
      await expect.poll(async () => trackCount(section, '.placeholder-card')).toBe(7);

      await setHostWidth(section, 1296);
      await expect.poll(async () => trackCount(section, '.placeholder-card')).toBe(8);

      await setHostWidth(section, 1671);
      await expect.poll(async () => trackCount(section, '.placeholder-card')).toBe(9);
      expectFixedCapTracks(await readGridMetrics(section, '.placeholder-card'), 9, compactCapPx);

      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await clearHostWidth(section);
    });

    await test.step('left menu open/close changes compact columns from grid width', async () => {
      await page.goto(parentContentUrl);
      await expect(compactHost.locator('.grid-item').first()).toBeVisible({ timeout: 30000 });
      await clearHostWidth(compactHost);
      await page.setViewportSize({ width: 2000, height: 1000 });
      await ensureLeftMenuExpanded(leftMenu, page);
      const withMenu = await readGridMetrics(compactHost, '.grid-item');
      await leftMenu.collapseLeftMenu();
      const withoutMenu = await readGridMetrics(compactHost, '.grid-item');
      expect(withoutMenu.hostWidth).toBeGreaterThan(withMenu.hostWidth);
      expect(withoutMenu.trackCount).toBeGreaterThanOrEqual(withMenu.trackCount);
    });
  });
});
