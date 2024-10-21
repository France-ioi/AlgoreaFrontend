import { expect, Page } from '@playwright/test';

export class Toast {
  constructor(private page: Page) {
  }

  async checksIsMessageVisible(message: string): Promise<void> {
    const toastLocator = this.page.locator('p-toast');
    const successfulLocator = toastLocator.getByText(message);
    await expect.soft(successfulLocator).toBeVisible();
    await expect.soft(toastLocator.getByLabel('Close')).toBeVisible();
    await toastLocator.getByLabel('Close').click();
    await expect.soft(successfulLocator).not.toBeVisible();
  }
}
