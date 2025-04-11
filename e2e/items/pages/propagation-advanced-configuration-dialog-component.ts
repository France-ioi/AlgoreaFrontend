import { expect, Page } from '@playwright/test';

export class PropagationAdvancedConfigurationDialogComponent {
  private titleLocator = this.page.getByText('Permission propagation configuration');
  private collapsibleSectionLocator = this.page.locator('alg-collapsible-section');

  constructor(private page: Page) {
  }

  async checksIsTitleLocatorVisible(): Promise<void> {
    await expect.soft(this.titleLocator).toBeVisible();
  }

  async toggleCollapsableSection(name: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    await expect.soft(targetSectionLocator).toBeVisible();
    await targetSectionLocator.click();
  }

  async toggleOptionValue(name: string, option: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    const progressSelectionLocation = targetSectionLocator.getByTestId('progress-selection').filter({
      has: this.page.getByText(option, { exact: true }),
    });
    await expect.soft(progressSelectionLocation).toBeVisible();
    await progressSelectionLocation.click();
  }

  async hoverOnOptionValue(name: string, option: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    const progressSelectionLocation = targetSectionLocator.getByTestId('progress-selection').filter({
      has: this.page.getByText(option, { exact: true }),
    });
    await expect.soft(progressSelectionLocation).toBeVisible();
    await progressSelectionLocation.hover({ force: true });
  }

  async checkIsValidationTooltipVisible(message: string): Promise<void> {
    await expect.soft(this.page.getByText(message)).toBeVisible();
  }
}
