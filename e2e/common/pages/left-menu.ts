import { Page, expect } from '@playwright/test';

export class LeftMenu {
  private leftPanelLocator = this.page.locator('alg-left-panel');
  private tabBarLocator = this.leftPanelLocator.locator('alg-left-tab-bar');
  private leftNavTreeLocator = this.leftPanelLocator.locator('alg-left-nav-tree');
  private searchPanelLocator = this.leftPanelLocator.locator('alg-left-menu-search');
  private searchTabButtonLocator = this.tabBarLocator.locator('[data-cy="main-menu-search-btn"]');

  constructor(private page: Page) {
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

  async checksIsTabsNotVisible(): Promise<void> {
    await this.checksIsTabNotVisible('Content');
    await this.checksIsTabNotVisible('Skills');
    await this.checksIsTabNotVisible('Groups');
  }

  async openSearch(): Promise<void> {
    await this.searchTabButtonLocator.click();
    await expect(this.searchPanelLocator).toBeVisible();
    await expect(this.leftNavTreeLocator).not.toBeVisible();
    await expect(this.searchTabButtonLocator).toHaveClass(/active/);
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
    const loadingLocator = this.leftPanelLocator.locator('alg-left-tabbed-content alg-loading');
    await expect(loadingLocator).toBeVisible();
    await expect(loadingLocator).not.toBeVisible();
  }

  async checksHasSearchResults(): Promise<void> {
    await expect(
      this.leftPanelLocator.locator('alg-left-search-result .result-list-link').first(),
    ).toBeVisible();
  }
}
