import { retry } from './helpers/retry';
import { GroupsMinePage } from './groups-mine.po';

describe('groups mine page', () => {
  const page = new GroupsMinePage();
  beforeEach(async () => {
    await page.navigateTo();
  });

  it('should display default activities in the left nav', async () => {
    const activeTab = page.getLeftNavActiveTab();
    await page.waitUntilTextIsPresent(activeTab, 'GROUPS');
    await retry(() => expect(activeTab.getText()).toContain('GROUPS'));
  });
});
