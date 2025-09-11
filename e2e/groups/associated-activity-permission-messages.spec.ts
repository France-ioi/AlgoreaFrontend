import { test, expect } from './fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test('checks can view info message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('groups/by-id/1769157720761729219;p=7002637463896228384;og=1769157720761729219/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item');
  await expect.soft(
    page.locator('alg-message-info').getByText('The activity is visible to all members of this group.')
  ).toBeVisible();
});

test('checks no access message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('groups/by-id/9024243890537335167;p=7002637463896228384;og=9024243890537335167/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item');
  await expect.soft(
    page.locator('alg-message-info').getByText('This activity may not be visible to the members of this group. You can grant them access by "observing" the group')
  ).toBeVisible();
});

test('checks with can\'t view and can\'t grant perm message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/9189508152532044730;p=7002637463896228384;og=9189508152532044730/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item');
  await expect.soft(
    page.locator('alg-message-info').getByText('You are not allowed to give access to this group, ask another manager to do so.')
  ).toBeVisible();
});

test('checks with current user can\'t grant and group can\'t view message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/752055703863185594;p=7002637463896228384;og=752055703863185594/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item');
  await expect.soft(page.locator('alg-message-info').getByText('This activity may not be visible to the members of this group. You are not allowed to grant access to this content, ask someone who has the permission to grant access to this content or make sure all your users can view the activity by other means (e.g. if it is public).')).toBeVisible();
});

test('checks can\'t determinate access message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/3434783988769832015;p=7002637463896228384;og=3434783988769832015/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item no perm');
  await expect.soft(
    page.locator('alg-message-info').getByText('You cannot view the permissions given to this activity, so we cannot determine if the group has access to it.')
  ).toBeVisible();
});

test('checks current user either cannot watch or grant perm to the item message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/4113242269106225458;p=7002637463896228384;og=4113242269106225458/settings');
  await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
  await groupSettingsPage.checksIsAssociatedActivityVisible('E2E: Associated Item no perm');
  await expect.soft(
    page.locator('alg-message-info').getByText('This activity may not be visible to the members of this group. You are not allowed to give access to this group, ask another manager to do so.')
  ).toBeVisible();
});
