import { Page, expect } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class GroupMembersPage {
  tabsLocator = this.page.locator('alg-selection');
  memberListLocator = this.page.locator('alg-member-list');
  approveConfirmationBtnLocator = this.page.getByRole('button', { name: 'Yes' });
  rejectConfirmationBtnLocator = this.page.getByRole('button', { name: 'No' });

  constructor(private readonly page: Page) {
  }

  async checksIsHeaderVisible(groupName: string): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: groupName })).toBeVisible();
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

  async checksIsAddSubGroupsSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Add subgroups')).toBeVisible();
  }

  async createChild(name: string): Promise<string | undefined> {
    const inputLocator = this.page.getByPlaceholder('Enter a title to create a new child');
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.fill(name);
    const classBtnLocator = this.page.locator('alg-add-content').getByText('Class');
    await expect.soft(classBtnLocator).toBeVisible();
    await classBtnLocator.click();
    const response = await this.page.waitForResponse(`${apiUrl}/groups`);
    await expect.soft(this.page.getByText('Group successfully added')).toBeVisible();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse: { data: { id: string | undefined } | undefined } = await response.json();
    return jsonResponse.data?.id;
  }
}
