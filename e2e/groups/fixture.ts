import { test as base } from '@playwright/test';
import { GroupSettingsPage } from './pages/group-settings-page';
import { MinePage } from './pages/mine-page';
import { JoinGroupConfirmation } from './pages/join-group-confirmation';
import { GroupMembersPage } from 'e2e/groups/pages/group-members-page';
import { UserPage } from 'e2e/groups/pages/user-page';
import { ManageGroupsPage } from 'e2e/groups/pages/manage-groups-page';

interface GroupFixtures {
  groupSettingsPage: GroupSettingsPage,
  minePage: MinePage,
  manageGroupsPage: ManageGroupsPage,
  joinGroupConfirmation: JoinGroupConfirmation,
  groupMembersPage: GroupMembersPage,
  userPage: UserPage,
}

export const test = base.extend<GroupFixtures>({
  groupSettingsPage: async ({ page }, use) => {
    await use(new GroupSettingsPage(page));
  },
  minePage: async ({ page }, use) => {
    await use(new MinePage(page));
  },
  manageGroupsPage: async ({ page }, use) => {
    await use(new ManageGroupsPage(page));
  },
  joinGroupConfirmation: async ({ page }, use) => {
    await use(new JoinGroupConfirmation(page));
  },
  groupMembersPage: async ({ page }, use) => {
    await use(new GroupMembersPage(page));
  },
  userPage: async ({ page }, use) => {
    await use(new UserPage(page));
  },
});

export { expect, Page } from '@playwright/test';
