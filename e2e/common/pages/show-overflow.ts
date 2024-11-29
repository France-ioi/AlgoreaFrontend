import { Page } from '@playwright/test';
import { expect } from 'e2e/common/fixture';

export class ShowOverflow {
  headerCaptionLocator = this.page.locator('alg-left-header').getByText('Algorea Platform');
  overlayContentAreaLocator = this.page.getByText('This content can be found in...');

  constructor(private page: Page) {
  }

  async checksIsOverflowVisible(): Promise<void> {
    await expect.soft(this.overlayContentAreaLocator).toBeVisible();
    await this.overlayContentAreaLocator.hover();
    await expect.soft(this.overlayContentAreaLocator).toBeVisible();
  }

  async checksIsOverflowNotVisible(): Promise<void> {
    await expect.soft(this.overlayContentAreaLocator).not.toBeVisible();
  }

  async hoverOut(): Promise<void> {
    await expect.soft(this.headerCaptionLocator).toBeVisible();
    await this.headerCaptionLocator.hover();
  }
}
