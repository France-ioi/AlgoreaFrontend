import { Page, expect } from '@playwright/test';

export class GroupHistoryPage {
  tableLocator = this.page.locator('alg-group-log-view').locator('p-table');
  forbiddenMessageLocator = this.page
    .getByText('The current user is not authorized to see the history with his current permissions on the group.');

  constructor(private readonly page: Page) {
  }

  async checksIsTableVisible(): Promise<void> {
    await expect.soft(this.tableLocator).toBeVisible();
  }

  async checksIsForbiddenMessageVisible(): Promise<void> {
    await expect.soft(this.forbiddenMessageLocator).toBeVisible();
  }
}
