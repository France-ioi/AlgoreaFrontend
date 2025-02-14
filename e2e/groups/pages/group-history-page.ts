import { Page, expect } from '@playwright/test';

export class GroupHistoryPage {
  tableLocator = this.page.locator('alg-group-log-view').locator('p-table');
  forbiddenMessageLocator = this.page.locator('alg-group-log-view')
    .getByText('You are not allowed to see activities of this user.');

  constructor(private readonly page: Page) {
  }

  async checksIsTableVisible(): Promise<void> {
    await expect.soft(this.tableLocator).toBeVisible();
  }

  async checksIsForbiddenMessageVisible(): Promise<void> {
    await expect.soft(this.forbiddenMessageLocator).toBeVisible();
  }
}
