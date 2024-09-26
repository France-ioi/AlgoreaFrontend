import { Page } from '@playwright/test';
import { expect } from 'e2e/items/fixture';

export class LostChangesConfirmationModal {
  titleLocator = this.page.getByText('Confirm Navigation');
  messageLocator = this.page.getByText('This page has unsaved changes. Do you want to leave this page and lose its changes?');
  confirmBtnLocator = this.page.getByRole('button', { name: 'Yes, leave page' });
  cancelBtnLocator = this.page.getByRole('button', { name: 'No' });

  constructor(private page: Page) {
  }

  async checksIsLostChangesConfirmationVisible(): Promise<void> {
    await expect.soft(this.titleLocator).toBeVisible();
    await expect.soft(this.messageLocator).toBeVisible();
  }

  async checksIsLostChangesConfirmationNotVisible(): Promise<void> {
    await expect.soft(this.titleLocator).not.toBeVisible();
    await expect.soft(this.messageLocator).not.toBeVisible();
  }

  async confirm(): Promise<void> {
    await expect.soft(this.confirmBtnLocator).toBeVisible();
    await this.confirmBtnLocator.click();
  }

  async cancel(): Promise<void> {
    await expect.soft(this.cancelBtnLocator).toBeVisible();
    await this.cancelBtnLocator.click();
  }
}
