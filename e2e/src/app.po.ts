import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  // "alg-root .content span" not found
  getTitleText() {
    return element(by.css('alg-root .content span')).getText() as Promise<string>;
  }

  getHeadingElement() {
    // Get the home page heading element reference
    return element(by.css('.platform-name'));
  }

  getActivitiesElements() {
    return element.all(by.css('.ui-treenode-content'));
  }

  getFirstPokemonCardElement() {
    return element(by.css('.ui-treenode-content'));
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
}
