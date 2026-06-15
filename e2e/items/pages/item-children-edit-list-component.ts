import { expect, Page } from '@playwright/test';

export class ItemChildrenEditListComponent {
  private listLocator = this.page.locator('alg-item-children-edit-list');
  private rowsLocator = this.listLocator.locator('tr.alg-table-body-tr');
  private removeBtnLocator = this.listLocator.locator('.alg-table-footer button');
  private propagationEditMenuLocator = this.page.locator('alg-propagation-edit-menu');
  private advancedConfigurationBtnLocator = this.propagationEditMenuLocator.getByRole('button', { name: 'Advanced configuration' });
  public enableScoreWeightLocator = this.page.getByTestId('enable-score-weight');

  constructor(private readonly page: Page) {
  }

  async getRowsCount(): Promise<number> {
    return this.rowsLocator.count();
  }

  async selectChildByIndex(index: number): Promise<void> {
    const rowCheckboxLocator = this.rowsLocator.nth(index).getByRole('checkbox');
    await expect.soft(rowCheckboxLocator).toBeVisible();
    await rowCheckboxLocator.check();
  }

  async removeSelected(): Promise<void> {
    await expect.soft(this.removeBtnLocator).toBeEnabled();
    await this.removeBtnLocator.click();
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

  async toggleEnableScoreWeight(): Promise<void> {
    await expect.soft(this.enableScoreWeightLocator).toBeVisible();
    await this.enableScoreWeightLocator.click();
  }
}
