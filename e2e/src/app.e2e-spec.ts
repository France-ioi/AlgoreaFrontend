import {AppPage} from './app.po';
import {browser, by, logging} from 'protractor';

describe('Algorea Frontend', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  describe('page static elements', () => {
    it('should shows the title', () => {
      void page.navigateTo();
      void expect(
        page.getTitleElement().getText()).toEqual('ALGOREA PLATFORM');
    });

    it('should have a working item-detail', () => {
      // Check if the first item exists and is working
      void page.navigateTo();
      void page.getFirstActivityElement().click();

      void expect(page.getMainContentElement()).toBeTruthy();
      void expect(page.getMainContentElement().getText()).toEqual('item-details works!');
    });

    it('should have a working collapse button', () => {
      void page.navigateTo();

      void expect(page.getLeftElement().getAttribute('class')).toMatch('expanded');
      void expect(page.getTopBarElement().getAttribute('class')).toMatch('expanded');
      void expect(page.getRightElement().getAttribute('class')).toMatch('expanded');

      void page.getCollapseButtonElement().click();

      void expect(page.getLeftElement().getAttribute('class')).toMatch('collapsed');
      void expect(page.getTopBarElement().getAttribute('class')).toMatch('collapsed');
      void expect(page.getRightElement().getAttribute('class')).toMatch('collapsed');
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', () => {
      void page.navigateTo();
      void browser.waitForAngular();

      void expect(
        page
          .getFirstActivityElement()
          .element(by.css('.node-label-title'))
          .getText()
      ).toContain('Activités publiques');
    });
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});

