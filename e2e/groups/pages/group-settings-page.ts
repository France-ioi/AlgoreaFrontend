import { Page, expect } from '@playwright/test';

export class GroupSettingsPage {
  inputDateLocator = this.page.getByTestId('input-date').getByRole('textbox');
  saveBtnLocator = this.page.getByRole('button', { name: 'Save' });

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checkRequiredApprovalsSectionIsVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
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
    await expect(this.page.getByText('Managers can access member\'s personal information')).toBeVisible();
    await expect(this.page.locator('li').filter({ hasText: option })).toBeVisible();
    await this.page.locator('li').filter({ hasText: option }).click();
  }

  async isLockMembershipInputDateVisible(): Promise<boolean> {
    await expect(this.page.getByText('Lock membership until a given date')).toBeVisible();
    return this.page.getByTestId('input-date').isVisible();
  }

  async isManagersCanAccessMemberPersonalInformationSelected(option: 'No' | 'Read only' | '≈'): Promise<boolean> {
    const locator = this.page.locator('li').filter({ hasText: option });
    return locator.evaluate(el => el.classList.contains('active'));
  }

  async isSaveBtnVisible(): Promise<boolean> {
    return this.saveBtnLocator.isVisible();
  }

  async saveChanges(): Promise<void> {
    await expect.soft(this.saveBtnLocator).toBeVisible();
    await expect.soft(this.saveBtnLocator).toBeEnabled();
    await this.saveBtnLocator.click();
    await expect.soft(this.page.getByText('SuccessChanges successfully')).toBeVisible();
  }
}
