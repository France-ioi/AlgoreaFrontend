import { browser, by, element, ElementFinder, ExpectedConditions } from 'protractor';

export class ItemPage {
  async navigateToActivity(itemId: string, path?: string[]): Promise<void> {
    const parts = [
      `/#/activities/by-id/${itemId}`,
      path && `;path=${path.join(',')}`,
      ';parentAttempId=0/details',
    ].filter(Boolean);

    const url = new URL(parts.join(''), browser.baseUrl).href;
    await browser.get(url);
  }

  async waitForElement(
    element: ElementFinder,
    threshold = 10000,
    message = 'Element taking too long to appear in the DOM',
  ): Promise<void> {
    await browser.wait(ExpectedConditions.visibilityOf(element), threshold, message);
  }

  getActivityTitle(): ElementFinder {
    return element(by.css('.task-title'));
  }
}
