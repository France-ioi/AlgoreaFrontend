import { expect, Page } from '@playwright/test';

export class ItemPermissionsComponent {
  itemPermissionsLocator = this.page.locator('alg-item-permissions');
  sectionHeaderLocator = this.itemPermissionsLocator.locator('alg-section-header');
  itemPermissionListLocator = this.itemPermissionsLocator.locator('.permission-indicator-section');

  constructor(private page: Page) {
  }

  async checksIsItemPermissionsSectionVisible(): Promise<void> {
    await expect.soft(this.itemPermissionsLocator).toBeVisible();
  }

  async checksIsPermissionRowWithValueVisible(name: string, value: string): Promise<void> {
    await expect.soft(this.itemPermissionListLocator.getByText(name)).toBeVisible();
    await expect.soft(this.sectionHeaderLocator.filter({ hasText: name }).getByText(value)).toBeVisible();
  }

  async checksIsPermissionRowNotVisible(name: string): Promise<void> {
    await expect.soft(this.itemPermissionListLocator.getByText(name)).not.toBeVisible();
  }
}
