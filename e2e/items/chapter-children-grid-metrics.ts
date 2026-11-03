import { expect, Locator, Page } from '@playwright/test';

export const normalCapPx = 265;
export const compactRowMaxPx = 1670;
export const compactGapPx = 16;
export const compactCapPx = (compactRowMaxPx - 8 * compactGapPx) / 9;

export interface GridMetrics {
  hostWidth: number,
  trackCount: number,
  trackSizesPx: number[],
  firstTileWidth: number | null,
}

export async function readGridMetrics(gridOrHost: Locator, tileSelector: string): Promise<GridMetrics> {
  return gridOrHost.evaluate((host, tileSel) => {
    const grid = (host.matches('.grid-container, .placeholder-grid')
      ? host
      : host.querySelector('.grid-container, .placeholder-grid')) as HTMLElement | null;
    if (!grid) {
      return { hostWidth: 0, trackCount: 0, trackSizesPx: [], firstTileWidth: null };
    }
    const tracks = getComputedStyle(grid).gridTemplateColumns.trim();
    const trackSizesPx = tracks === 'none' || tracks === ''
      ? []
      : tracks.split(/\s+/).map(part => Number.parseFloat(part));
    const tile = grid.querySelector(tileSel) as HTMLElement | null;
    return {
      hostWidth: (host as HTMLElement).getBoundingClientRect().width,
      trackCount: trackSizesPx.length,
      trackSizesPx,
      firstTileWidth: tile ? tile.getBoundingClientRect().width : null,
    };
  }, tileSelector);
}

export async function trackCount(host: Locator, tileSelector: string): Promise<number> {
  return (await readGridMetrics(host, tileSelector)).trackCount;
}

export async function setHostWidth(host: Locator, widthPx: number): Promise<void> {
  await host.evaluate((el, w) => {
    const node = el as HTMLElement;
    node.style.display = 'block';
    node.style.width = `${w}px`;
    node.style.maxWidth = `${w}px`;
    node.style.minWidth = `${w}px`;
    node.style.boxSizing = 'border-box';
  }, widthPx);
}

export async function clearHostWidth(host: Locator): Promise<void> {
  await host.evaluate(el => {
    const node = el as HTMLElement;
    node.style.width = '';
    node.style.maxWidth = '';
    node.style.minWidth = '';
  });
}

export function expectEqualFillingTracks(metrics: GridMetrics, columns: number): void {
  expect(metrics.trackCount).toBe(columns);
  expect(metrics.trackSizesPx.length).toBe(columns);
  const first = metrics.trackSizesPx[0]!;
  for (const size of metrics.trackSizesPx) {
    expect(Math.abs(size - first)).toBeLessThan(1);
  }
  expect(metrics.firstTileWidth).not.toBeNull();
  expect(Math.abs(metrics.firstTileWidth! - first)).toBeLessThan(2);
}

export function expectFixedCapTracks(metrics: GridMetrics, columns: number, capPx: number): void {
  expect(metrics.trackCount).toBe(columns);
  for (const size of metrics.trackSizesPx) {
    expect(Math.abs(size - capPx)).toBeLessThan(1);
  }
  expect(metrics.firstTileWidth).not.toBeNull();
  expect(metrics.firstTileWidth!).toBeLessThanOrEqual(capPx + 1);
  expect(Math.abs(metrics.firstTileWidth! - capPx)).toBeLessThan(2);
}

export async function ensureLeftMenuExpanded(
  leftMenu: { expandLeftMenu: () => Promise<void> },
  page: Page,
): Promise<void> {
  if (await page.locator('.left-menu.collapsed').count() > 0) {
    await leftMenu.expandLeftMenu();
  }
}

/** Apply or clear the same content margin the open right-thread panel uses. */
export async function setThreadMarginReserved(page: Page, reserved: boolean): Promise<void> {
  await page.locator('.right-container').evaluate((el, isReserved) => {
    el.classList.toggle('thread-collapsed', !isReserved);
  }, reserved);
}
