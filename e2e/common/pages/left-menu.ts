import { Page, expect } from '@playwright/test';

const layoutTolerancePx = 10;

export class LeftMenu {
  private leftMenuShellLocator = this.page.locator('alg-root .container > div.left-menu');
  private leftPanelLocator = this.page.locator('alg-left-panel');
  private rightContainerLocator = this.page.locator('alg-root .container > .right-container');
  private tabBarLocator = this.leftPanelLocator.locator('alg-left-tab-bar');
  private leftNavTreeLocator = this.leftPanelLocator.locator('alg-left-nav-tree');
  private searchPanelLocator = this.leftPanelLocator.locator('alg-left-menu-search');
  private searchTabButtonLocator = this.tabBarLocator.locator('[data-cy="main-menu-search-btn"]');
  private collapseButtonLocator = this.page.locator('[data-cy="left-menu-btn"]');

  constructor(private page: Page) {
  }

  private async cssVarLengthToPx(varName: string): Promise<number> {
    return this.page.evaluate((name) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const probe = document.createElement('div');
      probe.style.width = value;
      document.body.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      document.body.removeChild(probe);
      return px;
    }, varName);
  }

  async getLeftMenuWidth(): Promise<number> {
    const box = await this.leftMenuShellLocator.boundingBox();
    if (!box) throw new Error('Left menu shell is not visible');
    return box.width;
  }

  async getTabBarWidth(): Promise<number> {
    const box = await this.tabBarLocator.boundingBox();
    if (!box) throw new Error('Left tab bar is not visible');
    return box.width;
  }

  async getRightContainerLeft(): Promise<number> {
    const box = await this.rightContainerLocator.boundingBox();
    if (!box) throw new Error('Right container is not visible');
    return box.x;
  }

  async getExpectedCompactLeftMenuWidth(): Promise<number> {
    return this.cssVarLengthToPx('--left-panel-tab-bar-width');
  }

  async getExpectedFullLeftMenuWidth(): Promise<number> {
    return this.cssVarLengthToPx('--left-panel-width');
  }

  async waitsForCompactTreeLayout(): Promise<void> {
    await expect(this.leftPanelLocator).toHaveClass(/tree-compact/);
    await expect.poll(async () => {
      const [ menuWidth, tabBarWidth, fullWidth ] = await Promise.all([
        this.getLeftMenuWidth(),
        this.getTabBarWidth(),
        this.getExpectedFullLeftMenuWidth(),
      ]);
      return menuWidth < fullWidth - 50 && Math.abs(menuWidth - tabBarWidth) <= layoutTolerancePx;
    }, { message: 'left menu should settle to compact tab-bar width' }).toBe(true);
  }

  async waitsForFullTreeLayout(): Promise<void> {
    await expect(this.leftPanelLocator).not.toHaveClass(/tree-compact/);
    await expect.poll(async () => {
      const [ menuWidth, fullWidth ] = await Promise.all([
        this.getLeftMenuWidth(),
        this.getExpectedFullLeftMenuWidth(),
      ]);
      return Math.abs(menuWidth - fullWidth) <= layoutTolerancePx;
    }, { message: 'left menu should settle to full configured width' }).toBe(true);
  }

  async checksLeftMenuIsCompactWidth(): Promise<void> {
    await this.waitsForCompactTreeLayout();
    const [ menuWidth, tabBarWidth ] = await Promise.all([
      this.getLeftMenuWidth(),
      this.getTabBarWidth(),
    ]);
    expect.soft(Math.abs(menuWidth - tabBarWidth)).toBeLessThanOrEqual(layoutTolerancePx);
  }

  async checksLeftMenuIsFullWidth(): Promise<void> {
    await this.waitsForFullTreeLayout();
    const [ menuWidth, tabBarWidth ] = await Promise.all([
      this.getLeftMenuWidth(),
      this.getTabBarWidth(),
    ]);
    expect.soft(menuWidth).toBeGreaterThan(tabBarWidth + layoutTolerancePx);
  }

  async checksRightContentOffsetMatchesLeftMenu(): Promise<void> {
    await expect.poll(async () => {
      const [ menuWidth, rightLeft ] = await Promise.all([
        this.getLeftMenuWidth(),
        this.getRightContainerLeft(),
      ]);
      return Math.abs(rightLeft - menuWidth);
    }, { message: 'main content left edge should align with the left menu width' }).toBeLessThanOrEqual(layoutTolerancePx);
  }

  async checksRightContentIsFullWidth(): Promise<void> {
    await expect.poll(async () => this.getRightContainerLeft(), {
      message: 'main content should start at the left edge when the menu is collapsed',
    }).toBeLessThanOrEqual(layoutTolerancePx);
  }

  async checksLeftMenuShellIsVisible(): Promise<void> {
    await expect(this.leftMenuShellLocator).toBeVisible();
    await expect(this.leftMenuShellLocator).not.toHaveClass(/collapsed/);
  }

  async checksIsCompactTreeMode(): Promise<void> {
    await this.checksLeftMenuShellIsVisible();
    await expect.soft(this.leftNavTreeLocator).not.toBeVisible();
    await this.checksLeftMenuIsCompactWidth();
    await this.checksRightContentOffsetMatchesLeftMenu();
  }

  async checksIsFullTreeMode(): Promise<void> {
    await expect.soft(this.leftPanelLocator).not.toHaveClass(/tree-compact/);
    await this.checksIsLeftNavTreeVisible();
    await this.checksLeftMenuIsFullWidth();
    await this.checksRightContentOffsetMatchesLeftMenu();
  }

  async checksLeftMenuIsExpandedForSearch(): Promise<void> {
    await this.checksLeftMenuShellIsVisible();
    await expect.soft(this.leftPanelLocator).not.toHaveClass(/tree-compact/);
    await this.checksLeftMenuIsFullWidth();
    await this.checksRightContentOffsetMatchesLeftMenu();
    await expect.soft(this.searchPanelLocator).toBeVisible();
  }

  async collapseLeftMenu(): Promise<void> {
    await this.collapseButtonLocator.click();
    await expect(this.leftMenuShellLocator).toHaveClass(/collapsed/);
  }

  async checksLeftMenuIsCollapsed(): Promise<void> {
    await expect.soft(this.leftMenuShellLocator).toHaveClass(/collapsed/);
    await this.checksRightContentIsFullWidth();
  }

  async navigateToHiddenTreeChild(title: string | RegExp, itemId?: string): Promise<void> {
    if (itemId) {
      await this.page.locator(`a.item-link[href*="/a/${itemId}"]`).click();
      return;
    }
    const navLink = this.leftNavTreeLocator.locator('a').filter({ hasText: title });
    if (await navLink.count()) {
      await navLink.first().click();
      return;
    }
    await this.page.getByRole('link', { name: title, exact: typeof title === 'string' }).click();
  }

  async checksIsLeftMenuVisible(): Promise<void> {
    await expect.soft(this.leftPanelLocator).toBeVisible();
  }

  async checksIsTabVisible(name: string): Promise<void> {
    await expect.soft(this.tabBarLocator.getByRole('button').getByText(name)).toBeVisible();
  }

  async checksIsTabNotVisible(name: string): Promise<void> {
    await expect.soft(this.tabBarLocator.getByRole('button').getByText(name)).not.toBeVisible();
  }

  async checksIsLeftNavTreeVisible(): Promise<void> {
    await expect.soft(this.leftNavTreeLocator).toBeVisible();
  }

  async checksIsLeftNavTreeItemVisible(name: string): Promise<void> {
    await expect.soft(this.leftNavTreeLocator.getByText(name)).toBeVisible();
  }

  async checksIsTabBarNotVisible(): Promise<void> {
    await expect.soft(this.tabBarLocator).not.toBeVisible();
  }

  async checksIsTabsNotVisible(): Promise<void> {
    await this.checksIsTabBarNotVisible();
  }

  async openSearch(): Promise<void> {
    await this.searchTabButtonLocator.click();
    await expect(this.searchPanelLocator).toBeVisible();
    await expect(this.leftNavTreeLocator).not.toBeVisible();
    await expect(this.searchTabButtonLocator).toHaveClass(/active/);
    await this.waitsForFullTreeLayout();
  }

  async closeSearchWithX(): Promise<void> {
    await this.searchPanelLocator.getByRole('button', { name: 'Close search' }).click();
    await this.checksSearchPanelNotVisible();
  }

  async checksSearchPanelNotVisible(): Promise<void> {
    await expect(this.searchPanelLocator).not.toBeVisible();
  }

  async clickTab(name: 'Content' | 'Skills' | 'Groups' | 'Search'): Promise<void> {
    if (name === 'Search') {
      await this.searchTabButtonLocator.click();
      return;
    }
    await this.tabBarLocator.getByRole('button', { name }).click();
  }

  async checksTabIsActive(name: 'Content' | 'Skills' | 'Groups' | 'Search'): Promise<void> {
    const tabButton = name === 'Search'
      ? this.searchTabButtonLocator
      : this.tabBarLocator.getByRole('button', { name });
    await expect(tabButton).toHaveClass(/active/);
  }

  async searchFor(query: string): Promise<void> {
    await this.searchPanelLocator.getByRole('textbox').fill(query);
    // Wait for results rather than the transient loading indicator, which can finish before Playwright observes it.
    await this.checksHasSearchResults();
  }

  async checksHasSearchResults(): Promise<void> {
    await expect(
      this.leftPanelLocator.locator('alg-left-search-result .result-list-link').first(),
    ).toBeVisible();
  }
}
