import { browser, by, element, ElementFinder, ExpectedConditions } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  waitForElement(element: ElementFinder) {
    return browser.wait(ExpectedConditions.visibilityOf(element), 10000, 'Element taking too long to appear in the DOM');
  }

  getTitleElement() {
    // Get the home page heading element reference
    return element(by.css('.platform-name'));
  }

  getActivitiesElements() {
    return element.all(by.css('.p-treenode-content'));
  }

  getFirstActivityElement() {
    return element(by.css('.p-treenode-content'));
  }

  getFirstActivityLabelElement() {
    return this.getFirstActivityElement().element(by.css('.node-label-title'));
  }

  getLeftElement() {
    return element(by.css('.left'));
  }

  getTopBarElement() {
    return element(by.css('.top-bar'));
  }

  getRightElement() {
    return element(by.css('.right'));
  }

  getMainContentElement() {
    return element(by.css('.right .main-content p'));
  }

  getCollapseButtonElement() {
    return element(by.css('.nav-collapse'));
  }

  getSignOutElement () {
    return element(by.css('.sign-out'));
  }
}
