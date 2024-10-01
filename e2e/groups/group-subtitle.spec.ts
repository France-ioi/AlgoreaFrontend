import { test, expect } from 'e2e/groups/create-group-fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

const associatedItemName = 'Task #1';

test.beforeEach(async ({ page }) => {
  await initAsUsualUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

test('checks group subtitle add and remove', async ({ page, groupSettingsPage, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
  await expect.soft(page.getByRole('heading', { name: createGroup.groupName })).toBeVisible();

  await test.step('checks is associated activity section visible', async () => {
    await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
    await groupSettingsPage.checksIsAssociatedActivitySearchInputVisible();
  });

  await test.step('search and select exist content', async () => {
    await groupSettingsPage.searchAndSelectAssociatedActivity(associatedItemName);
  });

  await test.step('save group data', async () => {
    await Promise.all([
      groupSettingsPage.saveChangesAndCheckNotification(),
      groupSettingsPage.waitForGroupResponse(createGroup.groupId),
    ]);
  });

  await test.step('checks subtitle is visible', async () => {
    await groupSettingsPage.checksIsSubtitleVisible('Task #1');
  });

  await test.step('checks navigation to associated item', async () => {
    await groupSettingsPage.navigateToAssociatedActivity(associatedItemName);
    await expect.soft(page.getByRole('heading', { name: associatedItemName })).toBeVisible();
    await page.goBack();
    await groupSettingsPage.checksIsSubtitleLoadingVisible();
    await expect.soft(page.getByRole('heading', { name: createGroup.groupName })).toBeVisible();
  });

  await test.step('checks is associated activity visible', async () => {
    await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
    await groupSettingsPage.checksIsAssociatedActivityVisible(associatedItemName);
  });

  await test.step('remove associated activity', async () => {
    await groupSettingsPage.removeAssociatedActivity();
    await Promise.all([
      groupSettingsPage.saveChangesAndCheckNotification(),
      groupSettingsPage.waitForGroupResponse(createGroup.groupId),
    ]);
  });

  await test.step('checks subtitle is not visible', async () => {
    await groupSettingsPage.checksIsSubtitleNotVisible(associatedItemName);
  });
});

test('checks group subtitle failure response', async ({ page, groupSettingsPage, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
  await expect.soft(page.getByRole('heading', { name: createGroup.groupName })).toBeVisible();

  await test.step('checks is associated activity section visible', async () => {
    await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
    await groupSettingsPage.checksIsAssociatedActivitySearchInputVisible();
  });

  await test.step('search and select exist content', async () => {
    await groupSettingsPage.searchAndSelectAssociatedActivity(associatedItemName);
  });

  await test.step('save group data', async () => {
    await Promise.all([
      groupSettingsPage.saveChangesAndCheckNotification(),
      groupSettingsPage.waitForGroupResponse(createGroup.groupId),
      groupSettingsPage.abortOrContinueAssociatedItemResponse('10886782127135168', 'failed'),
    ]);
  });

  await test.step('checks is subtitle with error visible', async () => {
    await groupSettingsPage.checksIsSubtitleVisible('error while fetching the activity');
  });

  await test.step('checks retry subtitle', async () => {
    await groupSettingsPage.abortOrContinueAssociatedItemResponse('10886782127135168');
    await groupSettingsPage.retrySubtitle();
    await groupSettingsPage.checksIsSubtitleLoadingVisible();
    await groupSettingsPage.checksIsSubtitleVisible(associatedItemName);
  });

  await test.step('checks subtitle is forbidden', async () => {
    await groupSettingsPage.abortOrContinueAssociatedItemResponse('10886782127135168', 'accessdenied');
    await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=`);
    await groupSettingsPage.waitForGroupResponse(createGroup.groupId);
    await groupSettingsPage.checksIsSubtitleVisible('not visible');
  });
});
