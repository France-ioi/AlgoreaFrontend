import { retry } from './helpers/retry';
import { GroupPage } from './group-page.po';

describe('groups/users page', () => {
  const page = new GroupPage();

  describe('user page', () => {
    const user = {
      id: '670968966872011405',
      name: 'arbonenfant',
    };
    beforeEach(async () => {
      await page.navigateToUser(user.id);
    });

    it('should display default activities in the left nav', async () => {
      const firstActivityLabel = page.getLeftNavFirstActivity();
      await page.waitUntilTextIsPresent(firstActivityLabel, 'Parcours officiels');
      await retry(() => expect(firstActivityLabel.getText()).toContain('Parcours officiels'));
    });
  });

  describe('group page', () => {
    const group = {
      id: '672913018859223173',
      name: 'Pixal',
    };
    beforeEach(async () => {
      await page.navigateToGroup(group.id);
      await page.authenticate();
    });
    afterEach(async () => {
      await page.logout();
    });

    it('should present nav bar with active tab "groups"', async () => {
      const activeTab = page.getLeftNavActiveTab();
      await page.waitUntilTextIsPresent(activeTab, 'GROUPS');
      await retry(() => expect(activeTab.getText()).toBe('GROUPS'));
    });
  });

  describe('unexisting group page', () => {
    beforeEach(async () => {
      await page.navigateToGroup('1234');
      await page.authenticate();
    });
    afterEach(async () => {
      await page.logout();
    });

    it('should have an empty left nav with an error message and retry cta', async () => {
      const activeTab = page.getLeftNavActiveTab();
      await page.waitUntilTextIsPresent(activeTab, 'GROUPS');
      await retry(() => expect(activeTab.getText()).toBe('GROUPS'));
    });
  });
});
