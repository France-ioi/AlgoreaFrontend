import { expect, Page } from '@playwright/test';

export class JoinGroupConfirmation {
  joinGroupBtnLocator = this.page.getByText('Join group');
  cancelBtnLocator = this.page.getByText('Cancel');
  switchAgreeWithLockMembershipLocator = this.page.getByTestId('switch-agree-with-lock-membership');
  switchAgreeWithPersonalInfoViewLocator = this.page.getByTestId('switch-agree-with-personal-info-view');

  constructor(private readonly page: Page) {
  }

  async checkHeaderIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Joining a new group')).toBeVisible();
  }

  async checkHeaderIsNotVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Joining a new group')).not.toBeVisible();
  }

  async checkMessageIsVisible(groupName: string): Promise<void> {
    await expect.soft(this.page.getByText(`Do you want to join the group "${ groupName }"?`)).toBeVisible();
  }

  async checkJoinGroupBtnIsDisabled(): Promise<void> {
    await expect.soft(this.joinGroupBtnLocator).toBeVisible();
    await expect.soft(this.joinGroupBtnLocator).toBeDisabled();
  }

  async switchAgreeWithLockMembership(): Promise<void> {
    await expect.soft(this.switchAgreeWithLockMembershipLocator).toBeVisible();
    await this.switchAgreeWithLockMembershipLocator.click();
  }

  async switchAgreeWithPersonalInfoView(): Promise<void> {
    await expect.soft(this.switchAgreeWithPersonalInfoViewLocator).toBeVisible();
    await this.switchAgreeWithPersonalInfoViewLocator.click();
  }

  async joinGroup(): Promise<void> {
    await expect.soft(this.joinGroupBtnLocator).toBeEnabled();
    await this.joinGroupBtnLocator.click();
  }

  async cancel(): Promise<void> {
    await expect.soft(this.cancelBtnLocator).toBeEnabled();
    await this.cancelBtnLocator.click();
  }
}
