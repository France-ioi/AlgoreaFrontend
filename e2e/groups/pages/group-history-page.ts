import { Page, expect } from '@playwright/test';

export class GroupHistoryPage {
  tableLocator = this.page.locator('alg-group-log-view').locator('table');
  forbiddenMessageLocator = this.page
    .getByText('You don\'t have permission to view this group\'s history.');

  constructor(private readonly page: Page) {
  }

  async checksIsTableVisible(): Promise<void> {
    await expect.soft(this.tableLocator).toBeVisible();
  }

  async checksIsForbiddenMessageVisible(): Promise<void> {
    await expect.soft(this.forbiddenMessageLocator).toBeVisible();
  }
}
