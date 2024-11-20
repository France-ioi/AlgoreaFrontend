import { test as base } from './fixture';

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
    await groupMembersPage.goToTab('Sub-groups');
    await groupMembersPage.checksIsAddSubGroupsSectionVisible();
    const groupId = await groupMembersPage.createChild(groupName);
    if (groupId) await use({ groupName, groupId });
  },
  deleteGroup: async ({ groupSettingsPage, minePage, createGroup }, use) => {
    if (!createGroup) return;
    await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
    await groupSettingsPage.waitForGroupResponse(createGroup.groupId);
    await groupSettingsPage.checksIsDeleteButtonVisible();
    await groupSettingsPage.deleteGroup();
    await minePage.checkHeaderIsVisible();
    await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
    await groupSettingsPage.isNotAllowToViewMessageVisible();
    await use({ groupName: createGroup.groupName, groupId: createGroup.groupId });
  }
});

export { expect, Page } from '@playwright/test';
