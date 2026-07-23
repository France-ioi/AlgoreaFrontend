import { expect } from '@playwright/test';
import { test as base } from './fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';

interface GroupData {
  groupName: string,
  groupId: string,
}

interface CreateGroupFixtures {
  createGroup: GroupData | undefined,
  deleteGroup: GroupData | undefined,
}

export const test = base.extend<CreateGroupFixtures>({
  createGroup: async ({ page, groupMembersPage }, use) => {
    const rootGroupId = '8248811194835349084';
    const rootGroupName = 'E2E-generated-groups';
    const groupName = `E2E_Group_${ Date.now() }`;
    await page.goto(`groups/by-id/${rootGroupId};p=/members`);
    await groupMembersPage.checksIsHeaderVisible(rootGroupName);
    await groupMembersPage.goToTab('Sub-Groups');
    await groupMembersPage.checksIsAddSubGroupsSectionVisible();
    const groupId = await groupMembersPage.createChild(groupName);
    if (groupId) await use({ groupName, groupId });
  },
  deleteGroup: async ({ page, groupSettingsPage, groupMembersPage, minePage, createGroup }, use) => {
    if (!createGroup) return;
    // Ensure the deleter is a group manager regardless of the test's end-state auth.
    await initAsTesterUser(page);
    // Delete stays disabled while User children remain (plan assumed only subgroups block it).
    await groupMembersPage.removeAllMembersIfAny(createGroup.groupId);
    await Promise.all([
      groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`),
      groupSettingsPage.waitForGroupResponse(createGroup.groupId),
    ]);
    await groupSettingsPage.checksIsDeleteButtonVisible();
    // Hard wait: soft-enabled check would still proceed to a hung click if disabled.
    await expect(groupSettingsPage.deleteGroupBtnLocator).toBeEnabled();
    await groupSettingsPage.deleteGroup();
    await minePage.checkHeaderIsVisible();
    await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
    await groupSettingsPage.isNotAllowToViewMessageVisible();
    await use({ groupName: createGroup.groupName, groupId: createGroup.groupId });
  }
});

export { expect, Page } from '@playwright/test';
