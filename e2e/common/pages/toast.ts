import { expect, Page } from '@playwright/test';

export class Toast {
  constructor(private page: Page) {
  }

  async checksIsMessageVisible(message: string): Promise<void> {
    const toastLocator = this.page.locator('alg-toast-messages');
    const successfulLocator = toastLocator.getByText(message);
    await expect.soft(successfulLocator).toBeVisible();
    await expect.soft(toastLocator.getByRole('button')).toBeVisible();
    await toastLocator.getByRole('button').click();
    await expect.soft(successfulLocator).not.toBeVisible();
  }
}
