import { expect, Page } from '@playwright/test';

export class ManageGroupsPage {

  constructor(private readonly page: Page) {
  }

  async goto(url = '/groups/manage'): Promise<void> {
    await this.page.goto(url);
  }

  async checkHeaderIsVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Group management' })).toBeVisible();
  }

  async checkHeaderSubtitleIsVisible(): Promise<void> {
    await expect.soft(
      this.page.getByText('All the groups you manage')
    ).toBeVisible();
  }

  async checkManageGroupsSectionIsVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'The groups you manage' })).toBeVisible();
  }

  async checksNonAuthMessageIsVisible(): Promise<void> {
    await expect.soft(
      this.page.getByText('You need to be logged in to manage and create groups')
    ).toBeVisible();
  }
}
