import { Page, expect } from '@playwright/test';

export class GroupManagersPage {
  private groupManagersLocator = this.page.locator('alg-group-managers');
  private removeGroupManagersBtnLocator = this.groupManagersLocator.getByTestId('remove-group-managers');
  private confirmationModalLocator = this.page.locator('alg-confirmation-modal');
  private approveRemoveManagersConfirmationBtnLocator
    = this.confirmationModalLocator.getByRole('button', { name: 'Yes, remove me from the group' });
  private rejectRemoveManagersConfirmationBtnLocator = this.confirmationModalLocator.getByRole('button', { name: 'No' });

  constructor(private readonly page: Page) {
  }

  async checksIsGroupManagersTableVisible(): Promise<void> {
    await expect(this.groupManagersLocator).toBeVisible();
  }

  async switchIsManagerRowVisible(userName: string): Promise<void> {
    await expect.soft(this.groupManagersLocator.getByRole('row', { name: userName })).toBeVisible();
  }

  async switchCheckbox(userName: string): Promise<void> {
    await this.groupManagersLocator.getByRole('row', { name: userName }).getByRole('checkbox').click();
  }

  async checksIsRemoveGroupManagersBtnVisible(): Promise<void> {
    await expect(this.removeGroupManagersBtnLocator).toBeVisible();
  }

  async removeSelectedManagers(): Promise<void> {
    await this.removeGroupManagersBtnLocator.click();
  }

  async checksIsDeleteConfirmationVisible(text: string | RegExp): Promise<void> {
    await expect.soft(this.confirmationModalLocator.getByText(text)).toBeVisible();
  }

  async checksIsDeleteConfirmationNotVisible(text: string | RegExp): Promise<void> {
    await expect.soft(this.confirmationModalLocator.getByText(text)).not.toBeVisible();
  }

  async approveConfirmation(): Promise<void> {
    await expect.soft(this.approveRemoveManagersConfirmationBtnLocator).toBeVisible();
    await this.approveRemoveManagersConfirmationBtnLocator.click();
  }

  async rejectConfirmation(): Promise<void> {
    await expect.soft(this.rejectRemoveManagersConfirmationBtnLocator).toBeVisible();
    await this.rejectRemoveManagersConfirmationBtnLocator.click();
  }

  async openEditPermissionsModal(userName: string): Promise<void> {
    await this.groupManagersLocator.getByRole('row', { name: userName }).getByRole('button').click();
  }
}
