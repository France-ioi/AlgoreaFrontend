import { retry } from './helpers/retry';
import { GroupsMinePage } from './groups-mine.po';

describe('groups mine page', () => {
  const page = new GroupsMinePage();
  beforeEach(async () => {
    await page.navigateTo();
  });

  it('should display default activities in the left nav', async () => {
    const activityLabel = page.getLeftNavFirstActivity();
    await page.waitUntilTextIsPresent(activityLabel, 'Parcours officiels');
    await retry(() => expect(activityLabel.getText()).toContain('Parcours officiels'));
  });
});
