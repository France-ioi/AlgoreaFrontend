import { expect, Page } from '@playwright/test';

export class PropagationAdvancedConfigurationDialogComponent {
  private titleLocator = this.page.getByText('Permission propagation configuration');
  private collapsibleSectionLocator = this.page.locator('alg-collapsible-section');
  private proceedLocator = this.page.getByRole('button', { name: 'Proceed' });

  constructor(private page: Page) {
  }

  async checksIsTitleLocatorVisible(): Promise<void> {
    await expect.soft(this.titleLocator).toBeVisible();
  }

  async toggleCollapsableSection(name: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.locator('alg-section-header').filter({
      has: this.page.getByText(name, { exact: true }),
    });
    await expect.soft(targetSectionLocator).toBeVisible();
    await targetSectionLocator.click();
  }

  async selectOptionValue(name: string, option: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({
      has: this.page.locator('alg-section-header').getByText(name)
    });
    const progressSelectionLocation = targetSectionLocator.getByTestId('progress-selection').filter({
      has: this.page.getByText(option, { exact: true }),
    });
    await expect.soft(progressSelectionLocation).toBeVisible();
    await progressSelectionLocation.click();
  }

  async switchBooleanValue(name: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    const switchLocation = targetSectionLocator.locator('alg-switch-field');
    await expect.soft(switchLocation).toBeVisible();
    await switchLocation.click();
  }

  async hoverOnOptionValue(name: string, option: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    const progressSelectionLocation = targetSectionLocator.getByTestId('progress-selection').filter({
      has: this.page.getByText(option, { exact: true }),
    });
    await expect.soft(progressSelectionLocation).toBeVisible();
    await progressSelectionLocation.hover({ force: true });
  }

  async hoverOnSwitchValue(name: string): Promise<void> {
    const targetSectionLocator = this.collapsibleSectionLocator.filter({ has: this.page.getByText(name) });
    const switchLocation = targetSectionLocator.locator('alg-switch-field');
    await expect.soft(switchLocation).toBeVisible();
    await switchLocation.hover({ force: true });
  }

  async checkIsValidationTooltipVisible(message: string): Promise<void> {
    await expect.soft(this.page.getByText(message)).toBeVisible();
  }

  async isProceedBtnEnabled(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeEnabled();
  }

  async isProceedBtnDisabled(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeDisabled();
  }

  async savePermissions(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeVisible();
    await this.proceedLocator.click();
  }
}
