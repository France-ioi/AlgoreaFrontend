import { AppPage } from './app.po';
import { browser, ExpectedConditions, logging } from 'protractor';
import { expectOrRetry } from './helpers/expect';

describe('Algorea Frontend', () => {
  let page: AppPage;

  beforeEach(async () => {
    page = new AppPage();
    await page.navigateTo();
  });

  describe('page static elements', () => {
    it('should shows the title', async () => {
      await page.waitForElement(page.getTitleElement());
      await expect(page.getTitleElement().getText()).toEqual('ALGOREA PLATFORM');
    });

    it('should have a working item-detail', async () => {
      await browser.wait(ExpectedConditions.elementToBeClickable(page.getFirstActivityElement()), 10000);
      // Check if the first item exists and is working
      await page.getFirstActivityElement().click();
      await page.waitForElement(page.getMainContentElement());
      await expectOrRetry(() => expect(page.getMainContentElement().getText()).toBeTruthy());
      // await expect(page.getMainContentElement().getText()).toEqual('item-details works!');
    });

    it('should have a working collapse button', async () => {
      await expect(page.getLeftElement().getAttribute('class')).toMatch('expanded');
      await expect(page.getTopBarElement().getAttribute('class')).toMatch('expanded');
      await expect(page.getRightElement().getAttribute('class')).toMatch('expanded');

      await page.getCollapseButtonElement().click();

      await expect(page.getLeftElement().getAttribute('class')).toMatch('collapsed');
      await expect(page.getTopBarElement().getAttribute('class')).toMatch('collapsed');
      await expect(page.getRightElement().getAttribute('class')).toMatch('collapsed');
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', async () => {
      await browser.wait(ExpectedConditions.textToBePresentInElement(page.getFirstActivityLabelElement(), 'Parcours officiels'), 10000);
      await expectOrRetry(() => expect(page.getFirstActivityLabelElement().getText()).toContain('Parcours officiels'));
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

