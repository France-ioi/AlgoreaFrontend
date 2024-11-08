import { expect } from 'e2e/groups/create-group-fixture';
import { Page } from '@playwright/test';

export class Header {
  toggleGroupObservationLocator = this.page.getByTestId('toggle-group-observation');

  constructor(private readonly page: Page) {
  }

  async toggleGroupObservation(): Promise<void> {
    await expect.soft(this.toggleGroupObservationLocator).toBeVisible();
    await this.toggleGroupObservationLocator.click();
  }

  async clickOnSuggestedItem(name: string): Promise<void> {
    const suggestedItemLinkLocator = this.page.getByRole('link', { name });
    await expect.soft(suggestedItemLinkLocator).toBeVisible();
    await suggestedItemLinkLocator.click();
  }
}
