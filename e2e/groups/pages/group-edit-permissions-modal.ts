import { Page } from '@playwright/test';
import { expect } from 'e2e/groups/fixture';

export class GroupEditPermissionsModal {
  private proceedBtnLocator = this.page.getByRole('button', { name: 'Proceed' });
  private editPermissionsModalLocator = this.page.locator('alg-manager-permission-dialog');
  private collapsibleSectionLocator = this.page.locator('alg-collapsible-section');
  private confirmationModalLocator = this.page.locator('alg-confirmation-modal');
  private approveConfirmationBtnLocator
    = this.confirmationModalLocator.getByRole('button', { name: 'Yes, save these changes' });
  private rejectConfirmationBtnLocator = this.confirmationModalLocator.getByRole('button', { name: 'No' });
  private confirmationMessageLocator = this.confirmationModalLocator.getByText('Are you sure to remove from yourself the permission');

  constructor(private readonly page: Page) {
  }

  async checksIsPermissionsModalVisible(groupName: string, managerName: string): Promise<void> {
    await expect.soft(this.editPermissionsModalLocator.getByText(`${ groupName }: manager access given to ${ managerName }`)).toBeVisible();
  }

  async checksIsPermissionsModalNotVisible(): Promise<void> {
    await expect.soft(this.editPermissionsModalLocator).not.toBeVisible();
  }

  async selectOption(field: string, option: string): Promise<void> {
    const collapsibleSectionLocator = this.collapsibleSectionLocator.filter({
      has: this.page.locator('alg-section-header').getByText(field)
    });
    const optionLocator = collapsibleSectionLocator.getByText(option, { exact: true });
    await expect.soft(optionLocator).toBeVisible();
    await optionLocator.click();
  }

  async isSavePermissionsBtnDisabled(): Promise<void> {
    await expect.soft(this.proceedBtnLocator).toBeDisabled();
  }

  async isSavePermissionsBtnEnabled(): Promise<void> {
    await expect.soft(this.proceedBtnLocator).toBeEnabled();
  }

  async savePermissions(): Promise<void> {
    await expect.soft(this.proceedBtnLocator).toBeVisible();
    await this.proceedBtnLocator.click();
  }

  async isConfirmationModalVisible(): Promise<void> {
    await expect(this.confirmationMessageLocator).toBeVisible();
  }

  async isConfirmationModalNotVisible(): Promise<void> {
    await expect(this.confirmationMessageLocator).not.toBeVisible();
  }

  async approveConfirmation(): Promise<void> {
    await expect(this.approveConfirmationBtnLocator).toBeVisible();
    await this.approveConfirmationBtnLocator.click();
  }

  async rejectConfirmation(): Promise<void> {
    await expect(this.rejectConfirmationBtnLocator).toBeVisible();
    await this.rejectConfirmationBtnLocator.click();
  }
}
