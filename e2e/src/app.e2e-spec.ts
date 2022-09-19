import { AppPage } from './app.po';
import { retry } from './helpers/retry';

describe('Algorea Frontend', () => {
  const page = new AppPage();

  beforeEach(async () => {
    await page.navigateTo('/');
  });

  describe('page static elements', () => {
    it('should shows the title', async () => {
      const titleElement = page.getPlatformName();
      await page.waitUntilVisible(titleElement);
      await expect(titleElement.getText()).toEqual('ALGOREA PLATFORM');
    });

    it('should have clickable activity', async () => {
      const firstActivity = page.getLeftNavFirstActivity();
      await page.waitUntilClickable(firstActivity);
      await retry(() => expect(() => firstActivity.click()).not.toThrow());
    });

    it('should have a working collapse button', async () => {
      const collapseButton = page.getLeftNavCollapseButton();
      await page.waitUntilVisible(collapseButton);
      await page.waitUntilClickable(collapseButton);
      await retry(() => expect(() => collapseButton.click()).not.toThrow());
    });
  });

  describe('activities elements', () => {
    it('should shows the first element of the activity tree', async () => {
      const firstActivity = page.getLeftNavFirstActivity();
      await page.waitUntilTextIsPresent(firstActivity, 'Parcours officiels');
      await retry(() => expect(firstActivity.getText()).toContain('Parcours officiels'));
    });
  });
});

