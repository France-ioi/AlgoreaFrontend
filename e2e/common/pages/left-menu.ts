import { Page, expect } from '@playwright/test';

export class LeftMenu {
  private leftPanelLocator = this.page.locator('alg-left-panel');
  private tabBarLocator = this.leftPanelLocator.locator('alg-left-tab-bar');
  private leftNavTreeLocator = this.leftPanelLocator.locator('alg-left-nav-tree');

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
}
