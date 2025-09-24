import { Page, expect } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class UserPage {
  modifyPasswordBtnLocator = this.page.getByRole('button', { name: 'Modify password' });
  userGroupsWithGrantsLocator = this.page.locator('alg-user-groups-with-grants');

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checksIsHeaderVisible(userName: string): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: userName })).toBeVisible();
  }

  async checksIsTabVisible(tab: string): Promise<void> {
    await expect.soft(this.page.getByRole('link', { name: tab })).toBeVisible();
  }

  async checksIsTabNotVisible(tab: string): Promise<void> {
    await expect.soft(this.page.getByRole('link', { name: tab })).not.toBeVisible();
  }

  async goToTab(tab: string): Promise<void> {
    const tabLocator = this.page.getByRole('link', { name: tab });
    await expect.soft(tabLocator).toBeVisible();
    await tabLocator.click();
  }

  async checksIsProgressTableVisible(): Promise<void> {
    await expect.soft(this.page.locator('alg-group-log-view')).toBeVisible();
  }

  async checksIsModifyButtonVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('button', { name: 'Modify' })).toBeVisible();
  }

  async checksIsCurrentUserGroupsWithGrantsVisible(): Promise<void> {
    await expect.soft(this.userGroupsWithGrantsLocator).toBeVisible();
    await expect.soft(
      this.userGroupsWithGrantsLocator.getByText('The following information is what we receive from the login platform.')
    ).toBeVisible();
    await expect.soft(
      this.userGroupsWithGrantsLocator.getByText('The managers of the following group(s) have access to this information:')
    ).toBeVisible();
    await expect.soft(this.userGroupsWithGrantsLocator.getByRole('link', { name: 'JoinGroupTest' })).toBeVisible();
    await expect.soft(
      this.userGroupsWithGrantsLocator.getByText('The managers of the following group(s) can modify some of your personal information:')
    ).toBeVisible();
    await expect.soft(this.userGroupsWithGrantsLocator.getByRole('link', { name: 'OMD - 2019-2020' })).toBeVisible();
  }

  async checksIsOtherUserGroupsWithGrantsNotVisible(): Promise<void> {
    await expect.soft(this.userGroupsWithGrantsLocator).not.toBeVisible();
  }

  async checksIsEditableUserIntroHeaderVisible(): Promise<void> {
    await expect.soft(this.page.getByText('their personal information and modify their password')).toBeVisible();
  }
  async checksIsViewableUserIntroHeaderVisible(): Promise<void> {
    await expect.soft(this.page.getByText('their personal information.')).toBeVisible();
  }
  async checksIsNotViewableUserIntroHeaderVisible(): Promise<void> {
    await expect.soft(this.page.getByText('You are not authorized to view this user\'s personal information.')).toBeVisible();
  }

  async checksIsLoginVisible(value: string): Promise<void> {
    await expect.soft(this.page.locator('.alg-data-list').getByText('Login')).toBeVisible();
    await expect.soft(this.page.locator('.alg-data-list').getByText(value)).toBeVisible();
  }

  async checksIsFirstnameNotVisible(): Promise<void> {
    await expect.soft(this.page.locator('.alg-data-list').getByText('First Name')).not.toBeVisible();
  }

  async checksIsFirstnameVisible(value: string|null): Promise<void> {
    await expect.soft(this.page.locator('.alg-data-list').getByText('First Name')).toBeVisible();
    if (value) await expect.soft(this.page.locator('.alg-data-list').getByText(value)).toBeVisible();
  }

  async checksIsPlatformLanguageVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Platform language')).toBeVisible();
  }

  async checksIsForbiddenMessageVisible(): Promise<void> {
    await expect.soft(this.page.getByText('You cannot access this page')).toBeVisible();
  }

  async waitForLogsResponse(groupId?: string): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/log?limit=20${ groupId ? `&watched_group_id=${ groupId}` : '' }`);
  }

  async checksIsModifyPasswordBtnVisible(): Promise<void> {
    await expect.soft(this.modifyPasswordBtnLocator).toBeVisible();
  }

  async checksIsModifyPasswordBtnNotVisible(): Promise<void> {
    await expect.soft(this.modifyPasswordBtnLocator).not.toBeVisible();
  }
}
