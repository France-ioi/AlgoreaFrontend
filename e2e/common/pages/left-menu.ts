import { Page, expect } from '@playwright/test';

export class LeftMenu {
  private leftMenuLocator = this.page.locator('alg-left-menu');
  private leftNavLocator = this.leftMenuLocator.locator('alg-left-nav');
  private leftNavTreeLocator = this.leftNavLocator.locator('alg-left-nav-tree');

  constructor(private page: Page) {
  }

  async checksIsLeftMenuVisible(): Promise<void> {
    await expect.soft(this.leftMenuLocator).toBeVisible();
  }

  async checksIsTabVisible(name: string): Promise<void> {
    await expect.soft(this.leftNavLocator.getByRole('button').getByText(name)).toBeVisible();
  }

  async checksIsTabNotVisible(name: string): Promise<void> {
    await expect.soft(this.leftNavLocator.getByRole('button').getByText(name)).not.toBeVisible();
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
