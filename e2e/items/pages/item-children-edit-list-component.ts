import { expect, Page } from '@playwright/test';

export class ItemChildrenEditListComponent {
  private propagationEditMenuLocator = this.page.locator('alg-propagation-edit-menu');
  private advancedConfigurationBtnLocator = this.propagationEditMenuLocator.getByRole('button', { name: 'Advanced configuration' });

  constructor(private readonly page: Page) {
  }

  async openPropagationMenu(childName: string): Promise<void> {
    const targetTdLocator = this.page.getByRole('row').filter({ has: this.page.getByText(childName) });
    await expect.soft(targetTdLocator).toBeVisible();
    const menuButtonLocator = targetTdLocator.getByRole('button');
    await expect.soft(menuButtonLocator).toBeVisible();
    await menuButtonLocator.click();
    await expect.soft(this.propagationEditMenuLocator.getByText('Default access')).toBeVisible();
  }

  async openPropagationAdvancedConfigurationMenu(): Promise<void> {
    await expect.soft(this.advancedConfigurationBtnLocator).toBeVisible();
    await this.advancedConfigurationBtnLocator.click();
  }
}
