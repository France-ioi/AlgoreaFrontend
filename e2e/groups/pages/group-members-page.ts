import { Page, expect } from '@playwright/test';

export class GroupMembersPage {
  tabsLocator = this.page.locator('alg-selection');
  memberListLocator = this.page.locator('alg-member-list');
  approveConfirmationBtnLocator = this.page.getByRole('button', { name: 'Yes' });
  rejectConfirmationBtnLocator = this.page.getByRole('button', { name: 'No' });

  constructor(private readonly page: Page) {
  }

  async checksIsHeaderVisible(groupName: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: groupName })).toBeVisible();
  }

  async goToTab(tab: string): Promise<void> {
    await expect.soft(this.tabsLocator.getByText(tab)).toBeVisible();
    await this.tabsLocator.getByText(tab).click();
  }

  async checksIsGroupWithCheckboxVisible(groupName: string): Promise<void> {
    await expect.soft(this.memberListLocator.getByText(groupName)).toBeVisible();
    await expect.soft(
      this.page.getByRole('row', { name: groupName }).locator('p-tablecheckbox')
    ).toBeVisible();
  }

  async switchCheckbox(groupName: string): Promise<void> {
    await this.page.getByRole('row', { name: groupName }).locator('p-tablecheckbox').click();
  }

  async selectAllCheckboxes(): Promise<void> {
    await expect.soft(
      this.page.getByTestId('member-list-select-all')
    ).toBeVisible();
    await this.page.getByTestId('member-list-select-all').click();
  }

  async removeCheckedFromGroup(): Promise<void> {
    await expect.soft(
      this.page.getByRole('button', { name: 'Remove from group' })
    ).toBeVisible();
    await this.page.getByRole('button', { name: 'Remove from group' }).click();
  }

  async checksIsDeleteConfirmationVisible(text: string | RegExp): Promise<void> {
    await expect.soft(
      this.page.getByRole('alertdialog').locator('div').filter({ hasText: text })
    ).toBeVisible();
  }

  async checksIsDeleteConfirmationNotVisible(text: string | RegExp): Promise<void> {
    await expect.soft(
      this.page.getByRole('alertdialog').locator('div').filter({ hasText: text })
    ).not.toBeVisible();
  }

  async approveConfirmation(): Promise<void> {
    await expect.soft(this.approveConfirmationBtnLocator).toBeVisible();
    await this.approveConfirmationBtnLocator.click();
  }

  async rejectConfirmation(): Promise<void> {
    await expect.soft(this.rejectConfirmationBtnLocator).toBeVisible();
    await this.rejectConfirmationBtnLocator.click();
  }
}
