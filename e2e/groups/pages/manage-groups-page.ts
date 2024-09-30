import { expect, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

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

  async waitForManagedGroupsResponse(): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/current-user/managed-groups`);
  }

  async checksIsManagedGroupsTableVisible(): Promise<void> {
    await expect.soft(this.page.locator('alg-managed-group-list').filter({ has: this.page.getByRole('table') })).toBeVisible();
  }

  async checksIsCreateGroupSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Create a new group')).toBeVisible();
  }

  async createGroup(name: string): Promise<string | undefined> {
    const inputLocator = this.page.getByPlaceholder('Enter a title to create a new group');
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.fill(name);
    const classBtnLocator = this.page.locator('alg-add-content').getByText('Class');
    await expect.soft(classBtnLocator).toBeVisible();
    await classBtnLocator.click();
    const response = await this.page.waitForResponse(`${apiUrl}/groups`);
    await expect.soft(this.page.getByText('Group successfully created')).toBeVisible();
    await expect.soft(this.page.getByRole('heading', { name })).toBeVisible();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse: { data: { id: string | undefined } | undefined } = await response.json();
    return jsonResponse.data?.id;
  }
}
