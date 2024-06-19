import { Page, expect } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class UserPage {
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

  async checksIsPersonalInformationSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
  }

  async checksIsSchoolInformationSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'School Information' })).toBeVisible();
  }

  async checksIsContactInformationSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Contact Information' })).toBeVisible();
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
}
