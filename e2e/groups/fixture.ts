import { test as base } from '@playwright/test';
import { GroupSettingsPage } from './pages/group-settings-page';
import { MinePage } from './pages/mine-page';
import { JoinGroupConfirmation } from './pages/join-group-confirmation';

interface GroupFixtures {
  groupSettingsPage: GroupSettingsPage,
  minePage: MinePage,
  joinGroupConfirmation: JoinGroupConfirmation,
}

export const test = base.extend<GroupFixtures>({
  groupSettingsPage: async ({ page }, use) => {
    await use(new GroupSettingsPage(page));
  },
  minePage: async ({ page }, use) => {
    await use(new MinePage(page));
  },
  joinGroupConfirmation: async ({ page }, use) => {
    await use(new JoinGroupConfirmation(page));
  },
});

export { expect, Page } from '@playwright/test';
