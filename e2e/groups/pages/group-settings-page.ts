import { Page, expect } from '@playwright/test';

export class GroupSettingsPage {
  inputDateLocator = this.page.getByTestId('input-date').getByRole('textbox');
  saveBtnLocator = this.page.getByRole('button', { name: 'Save' });
  strengthenedConfirmationMessageLocator
    = this.page.getByText('As you have strengthened approval conditions, all group members have to re-approve the new conditions');
  strengthenedConfirmationCancelBtnLocator = this.page.getByRole('button', { name: 'Cancel', exact: true });

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checkRequiredApprovalsSectionIsVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
  }

  async enableLockMembershipUntilInputDate(): Promise<void> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(this.page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
    await this.page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(this.inputDateLocator).toBeVisible();
  }

  async disableLockMembershipUntilInputDate(): Promise<void> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(this.page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
    await this.page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(this.page.getByTestId('input-date')).not.toBeVisible();
  }

  async fillDate(input: string): Promise<void> {
    await this.inputDateLocator.fill(input);
  }

  async selectManagersCanAccessMemberPersonalInformation(option: 'No' | 'Read only' | 'Read and edit'): Promise<void> {
    await expect.soft(this.page.getByText('Managers can access member\'s personal information')).toBeVisible();
    const requirePersonalInfoAccessApprovalSelectionLocator
      = this.page.getByTestId('selection-control-value').filter({ hasText: option });
    await expect.soft(requirePersonalInfoAccessApprovalSelectionLocator).toBeVisible();
    await requirePersonalInfoAccessApprovalSelectionLocator.click();
  }

  async isLockMembershipInputDateVisible(): Promise<boolean> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    return this.page.getByTestId('input-date').isVisible();
  }

  async isManagersCanAccessMemberPersonalInformationSelected(option: 'No' | 'Read only' | 'Read and edit'): Promise<boolean> {
    const locator = this.page.locator('li').filter({ hasText: option });
    return locator.evaluate(el => el.classList.contains('active'));
  }

  async checkIsStrengthenedApprovalConfirmationVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationMessageLocator).toBeVisible();
  }

  async checkIsStrengthenedApprovalConfirmationNotVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationMessageLocator).not.toBeVisible();
  }

  async checkIsStrengthenedConfirmationCancelBtnVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationCancelBtnLocator).toBeVisible();
  }

  async cancelStrengthenedConfirmation(): Promise<void> {
    await this.strengthenedConfirmationCancelBtnLocator.click();
    await this.checkIsStrengthenedApprovalConfirmationNotVisible();
  }

  async selectStrengthenedConfirmationOperation(
    operation: 'Cancel' | 'Remove all members' | 'Remove and re-invite all members'
  ): Promise<void> {
    await this.page.getByRole('button', { name: operation, exact: true }).click();
  }

  async isSaveBtnVisible(): Promise<boolean> {
    return this.saveBtnLocator.isVisible();
  }

  async checkSuccessfulNotification(): Promise<void> {
    await expect.soft(this.page.getByText('SuccessChanges successfully')).toBeVisible();
  }

  async saveChanges(): Promise<void> {
    await expect.soft(this.saveBtnLocator).toBeVisible();
    await expect.soft(this.saveBtnLocator).toBeEnabled();
    await this.saveBtnLocator.click();
  }

  async saveChangesAndCheckNotification(): Promise<void> {
    await this.saveChanges();
    await this.checkSuccessfulNotification();
  }
}
