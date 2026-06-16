import { expect, Page } from '@playwright/test';

export class Toast {
  constructor(private page: Page) {
  }

  async checksIsMessageVisible(message: string): Promise<void> {
    const toastLocator = this.page.locator('alg-toast-messages');
    const messageRow = toastLocator.locator('.message').filter({ hasText: message }).first();
    await expect.soft(messageRow).toBeVisible();
    // Best-effort cleanup: try to close the toast so the next assertion sees a clean state.
    // Toasts auto-dismiss after 5s (DISPLAY_DURATION in MessageService), so on a slow CI runner
    // the close button may already be gone by the time we try to click it; don't fail the test
    // on that — the next `not.toBeVisible()` assertion is the real post-condition.
    await messageRow.getByRole('button').click({ timeout: 1000 }).catch(() => undefined);
    await expect.soft(messageRow).not.toBeVisible();
  }
}
