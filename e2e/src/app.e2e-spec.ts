import { AppPage } from './app.po';
import { browser, ExpectedConditions, logging } from 'protractor';
import { retry } from './helpers/retry';

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
      await retry(() => page.getFirstActivityElement().click());

      await page.waitForElement(page.getMainContentElement());
      await retry(() => expect(page.getMainContentElement().getText()).toBeTruthy());
      // await expect(page.getMainContentElement().getText()).toEqual('item-details works!');
    });

    it('should have a working collapse button', async () => {
      await expect(page.getLeftElement().getAttribute('class')).not.toMatch('collapsed');
      await expect(page.getTopBarElement().getAttribute('class')).not.toMatch('collapsed');
      await expect(page.getRightElement().getAttribute('class')).not.toMatch('collapsed');

      await page.getCollapseButtonElement().click();

      // await expect(page.getLeftElement().getAttribute('class')).toMatch('collapsed');
      // await expect(page.getTopBarElement().getAttribute('class')).toMatch('collapsed');
      // await expect(page.getRightElement().getAttribute('class')).toMatch('collapsed');
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', async () => {
      await browser.wait(ExpectedConditions.textToBePresentInElement(page.getFirstActivityLabelElement(), 'Parcours officiels'), 10000);
      await retry(() => expect(page.getFirstActivityLabelElement().getText()).toContain('Parcours officiels'));
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

