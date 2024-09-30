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
  createGroup: async ({ manageGroupsPage }, use) => {
    const groupName = `E2E_${ Date.now() }`;
    await manageGroupsPage.goto();
    await manageGroupsPage.checkHeaderIsVisible();
    await manageGroupsPage.waitForManagedGroupsResponse();
    await manageGroupsPage.checksIsManagedGroupsTableVisible();
    await manageGroupsPage.checksIsCreateGroupSectionVisible();
    const groupId = await manageGroupsPage.createGroup(groupName);
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
