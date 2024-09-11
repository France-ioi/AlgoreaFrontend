import { Page } from '@playwright/test';
import { expect } from 'e2e/items/fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class EditPermissionsModal {
  private canEnterHeaderLocator = this.page.locator('alg-section-header').filter({ hasText: 'Can enter' });
  private canEnterSwitchFieldLocator = this.page.getByTestId('can-enter-switch-field');
  private canEnterSwitchLocator = this.canEnterSwitchFieldLocator.locator('alg-switch');
  private fromInputLocator = this.page.getByTestId('can-enter-from-control').getByRole('textbox');
  private untilInputLocator = this.page.getByTestId('can-enter-until-control').getByRole('textbox');
  private proceedLocator = this.page.getByRole('button', { name: 'Proceed' });
  private itemPermissionsLocator = this.page.locator('alg-item-permissions');
  private editPermissionsBtnLocator = this.page.getByText('Edit permissions');
  private canEnterWarningLocator = this.page.getByText('As the group or user has currently "can view >= content" permission, the configured entering times have no effect, the group or user will be able to enter the activity at any time the activity allows it.');
  private editPermissionsModalLocator = this.page.getByText('Permission editor');

  constructor(private readonly page: Page) {
  }

  async openPermissionsBlock(): Promise<void> {
    await expect.soft(this.itemPermissionsLocator).toBeVisible();
    await this.itemPermissionsLocator.click();
  }

  async openPermissionsModal(): Promise<void> {
    await expect.soft(this.editPermissionsBtnLocator).toBeVisible();
    await this.editPermissionsBtnLocator.click();
    await expect.soft(this.editPermissionsModalLocator).toBeVisible();
  }

  async checksIsPermissionsModalNotVisible(): Promise<void> {
    await expect.soft(this.editPermissionsModalLocator).not.toBeVisible();
  }

  async waitForPermissionsResponse(url: string): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/${url}`);
  }

  async checksIsCanEnterSwitchFieldVisible(): Promise<void> {
    await expect.soft(this.canEnterSwitchFieldLocator).toBeVisible();
  }

  async checksIsCanEnterSwitchFieldNotVisible(): Promise<void> {
    await expect.soft(this.canEnterSwitchFieldLocator).not.toBeVisible();
  }


  async openField(field: string): Promise<void> {
    const collapsibleSectionLocator = this.page.locator('alg-collapsible-section', { hasText: field });
    await expect.soft(collapsibleSectionLocator).toBeVisible();
    await collapsibleSectionLocator.click();
  }

  async selectOption(field: string, option: string): Promise<void> {
    const collapsibleSectionLocator = this.page.locator('alg-collapsible-section', { hasText: field });
    const optionLocator = collapsibleSectionLocator.getByText(option, { exact: true });
    await expect.soft(optionLocator).toBeVisible();
    await optionLocator.click();
  }

  async toggleCanEnterSwitchField(): Promise<void> {
    await this.canEnterHeaderLocator.click();
  }

  async checksIsCanEnterSwitchVisible(): Promise<void> {
    await expect.soft(this.canEnterSwitchLocator).toBeVisible();
  }

  async checksIsCanEnterValueInHeaderVisible(value: string): Promise<void> {
    await expect.soft(this.canEnterHeaderLocator.filter({ hasText: value })).toBeVisible();
  }

  async toggleCanEnterSwitch(): Promise<void> {
    await this.canEnterSwitchLocator.click();
  }

  async isFromUntilInputsVisible(): Promise<boolean> {
    return this.fromInputLocator.isVisible();
  }

  async checksIsFromUntilInputsVisible(): Promise<void> {
    await expect.soft(this.fromInputLocator).toBeVisible();
    await expect.soft(this.untilInputLocator).toBeVisible();
  }

  async checksIsFromUntilInputsNotVisible(): Promise<void> {
    await expect.soft(this.fromInputLocator).not.toBeVisible();
    await expect.soft(this.untilInputLocator).not.toBeVisible();
  }

  async checksIsFromDateValueVisible(dateString: string): Promise<void> {
    await expect.soft(this.fromInputLocator).toHaveValue(dateString);
  }

  async checksIsUntilDateValueVisible(dateString: string): Promise<void> {
    await expect.soft(this.untilInputLocator).toHaveValue(dateString);
  }

  async fillFromValue(dateString: string): Promise<void> {
    await this.fromInputLocator.focus();
    await this.fromInputLocator.fill(dateString);
  }

  async fillUntilValue(dateString: string): Promise<void> {
    await this.untilInputLocator.focus();
    await this.untilInputLocator.fill(dateString);
  }

  async blurUntilInput(): Promise<void> {
    await this.untilInputLocator.blur();
  }

  async checksIsUntilValidationMessageVisible(dateString: string): Promise<void> {
    await expect.soft(this.page.getByText(`The until date must be greater than: ${dateString}`)).toBeVisible();
  }

  async checksIsUntilValidationMessageNotVisible(dateString: string): Promise<void> {
    await expect.soft(this.page.getByText(`The until date must be greater than: ${dateString}`)).not.toBeVisible();
  }

  async checksIsCanEnterWarningVisible(): Promise<void> {
    await expect.soft(this.canEnterWarningLocator).toBeVisible();
  }

  async checksIsCanEnterWarningNotVisible(): Promise<void> {
    await expect.soft(this.canEnterWarningLocator).not.toBeVisible();
  }

  async isSavePermissionsBtnDisabled(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeDisabled();
  }

  async isSavePermissionsBtnEnabled(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeEnabled();
  }

  async savePermissions(): Promise<void> {
    await expect.soft(this.proceedLocator).toBeVisible();
    await this.proceedLocator.click();
  }
}
