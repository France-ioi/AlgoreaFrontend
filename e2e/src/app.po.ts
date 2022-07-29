import { browser, by, element, ElementFinder, ExpectedConditions } from 'protractor';

export class AppPage {
  async authenticate(): Promise<void> {
    const [ authTokenKey, authTokenValue ] = process.env.E2E_AUTH_USER?.split(',') ?? [];
    if (!authTokenKey || !authTokenValue) throw new Error('Env var "E2E_AUTH_USER=[key],[value]" must be provided');
    await browser.executeScript(`window.sessionStorage.setItem('${authTokenKey}', '${authTokenValue}')`);
    await browser.refresh();
  }

  async logout(): Promise<void> {
    await browser.executeScript('window.sessionStorage.clear()');
  }

  async navigateTo(relativeUrl: string): Promise<void> {
    const url = new URL(relativeUrl, browser.baseUrl);
    await browser.get(url.href);
    await browser.refresh(); // avoid stateful traumas
  }

  async waitUntilVisible(
    element: ElementFinder,
    threshold = 10000,
    message = 'Element taking too long to appear in the DOM',
  ): Promise<void> {
    await browser.wait(ExpectedConditions.visibilityOf(element), threshold, message);
  }

  async waitUntilClickable(
    element: ElementFinder,
    threshold = 10000,
    message = 'Element taking too long to be clickable',
  ): Promise<void> {
    await browser.wait(ExpectedConditions.elementToBeClickable(element), threshold, message);
  }

  async waitUntilTextIsPresent(
    element: ElementFinder,
    text: string,
    threshold = 10000,
    message = `Element taking too long to have text "${text}"`,
  ): Promise<void> {
    await browser.wait(ExpectedConditions.textToBePresentInElement(element, text), threshold, message);
  }

  getPlatformName(): ElementFinder {
    // Get the home page heading element reference
    return element(by.css('.platform-name'));
  }

  getLeftNavFirstActivity(): ElementFinder {
    return element(by.css('.p-treenode-content'));
  }

  getLeftNavCollapseButton(): ElementFinder {
    return element(by.css('.nav-collapse'));
  }

  getLeftNavActiveTab(): ElementFinder {
    return element(by.css('.left .tab-left-nav [role=tab][aria-selected=true]'));
  }

  getLeftNavError(): ElementFinder {
    return element(by.css('.left alg-left-nav alg-error'));
  }

  getLeftNavErrorMessage(): ElementFinder {
    return this.getLeftNavError().element(by.css('.message'));
  }

  getLeftNavErrorRetryCta(): ElementFinder {
    return this.getLeftNavError().element(by.css('.retry'));
  }

}
