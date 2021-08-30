/* eslint-disable @typescript-eslint/no-floating-promises */
import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('Algorea Frontend', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
    page.navigateTo();
  });

  describe('page static elements', () => {
    it('should shows the title', () => {
      page.waitForElement(page.getTitleElement());
      expect(page.getTitleElement().getText()).toEqual('ALGOREA PLATFORM');
    });

    it('should have a working item-detail', () => {
      page.waitForElement(page.getFirstActivityElement());
      // Check if the first item exists and is working
      page.getFirstActivityElement().click();
      page.waitForElement(page.getMainContentElement());
      expect(page.getMainContentElement().getText()).toBeTruthy();
      // expect(page.getMainContentElement().getText()).toEqual('item-details works!');
    });

    it('should have a working collapse button', () => {
      expect(page.getLeftElement().getAttribute('class')).toMatch('expanded');
      expect(page.getTopBarElement().getAttribute('class')).toMatch('expanded');
      expect(page.getRightElement().getAttribute('class')).toMatch('expanded');

      page.getCollapseButtonElement().click();

      expect(page.getLeftElement().getAttribute('class')).toMatch('collapsed');
      expect(page.getTopBarElement().getAttribute('class')).toMatch('collapsed');
      expect(page.getRightElement().getAttribute('class')).toMatch('collapsed');
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', () => {
      page.waitForElement(page.getFirstActivityLabelElement());
      expect(page.getFirstActivityLabelElement().getText()).toContain('Parcours officiels');
    });
  });

  afterEach(() => {
    // Assert that there are no errors emitted from the browser
    const logs = browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});

