import { test } from './fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

const groupChildrenJson = [
  {
    'id': '1',
    'name': 'With children',
    'type': 'Other',
    'grade': -2,
    'is_open': false,
    'is_public': false,
    'is_empty': false,
    'current_user_is_manager': true,
    'current_user_can_manage': 'memberships_and_group',
    'current_user_can_grant_group_access': true,
    'current_user_can_watch_members': true,
    'user_count': 0
  },
  {
    'id': '1',
    'name': 'With no children',
    'type': 'Other',
    'grade': -2,
    'is_open': false,
    'is_public': false,
    'is_empty': true,
    'current_user_is_manager': true,
    'current_user_can_manage': 'memberships_and_group',
    'current_user_can_grant_group_access': true,
    'current_user_can_watch_members': true,
    'user_count': 0
  },
];

const groupName = 'Pixal';

test('delete subgroup when children are not empty', async ({ page, groupMembersPage }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/672913018859223173;p=52767158366271444/members');
  await page.route(`${apiUrl}/groups/672913018859223173/children?types_exclude=Team,Session,User`, async route => {
    await route.fulfill({ json: groupChildrenJson });
  });

  await test.step('checks the group with children to be visible', async () => {
    await groupMembersPage.checksIsHeaderVisible(groupName);
    await groupMembersPage.goToTab('Sub-groups');
    await groupMembersPage.checksIsGroupWithCheckboxVisible('With children');
  });

  await test.step('checks the confirmation with notification it has children', async () => {
    await groupMembersPage.switchCheckbox('With children');
    await groupMembersPage.removeCheckedFromGroup();
    await groupMembersPage.checksIsDeleteConfirmationVisible('By removing');
    await groupMembersPage.approveConfirmation();
    await groupMembersPage.checksIsDeleteConfirmationNotVisible('By removing');
  });
});

test('delete subgroup when children are empty', async ({ page, groupMembersPage }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/672913018859223173;p=52767158366271444/members');
  await page.route(`${apiUrl}/groups/672913018859223173/children?types_exclude=Team,Session,User`, async route => {
    await route.fulfill({ json: groupChildrenJson });
  });

  await test.step('checks the group with children to be visible', async () => {
    await groupMembersPage.checksIsHeaderVisible(groupName);
    await groupMembersPage.goToTab('Sub-groups');
    await groupMembersPage.checksIsGroupWithCheckboxVisible('With no children');
  });

  await test.step('checks the confirmation with offer to delete the group', async () => {
    await groupMembersPage.switchCheckbox('With no children');
    await groupMembersPage.removeCheckedFromGroup();
    await groupMembersPage.checksIsDeleteConfirmationVisible(/^Do you also want to delete the group\?$/);
    await groupMembersPage.approveConfirmation();
    await groupMembersPage.checksIsDeleteConfirmationNotVisible(/^Do you also want to delete the group\?$/);
  });

  await test.step('checks the confirmation of delete group operation', async () => {
    await groupMembersPage.checksIsDeleteConfirmationVisible('Are you sure you want to permanently delete');
    await groupMembersPage.approveConfirmation();
    await groupMembersPage.checksIsDeleteConfirmationNotVisible('Are you sure you want to permanently delete');
  });
});

test('delete multiple subgroups when children are empty and non empty', async ({ page, groupMembersPage }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/672913018859223173;p=52767158366271444/members');
  await page.route(`${apiUrl}/groups/672913018859223173/children?types_exclude=Team,Session,User`, async route => {
    await route.fulfill({ json: groupChildrenJson });
  });

  await test.step('checks the groups with no children and with children to be visible', async () => {
    await groupMembersPage.checksIsHeaderVisible(groupName);
    await groupMembersPage.goToTab('Sub-groups');
    await groupMembersPage.checksIsGroupWithCheckboxVisible('With children');
    await groupMembersPage.checksIsGroupWithCheckboxVisible('With no children');
  });

  await test.step('checks the confirmation with notification it has children', async () => {
    await groupMembersPage.selectAllCheckboxes();
    await groupMembersPage.removeCheckedFromGroup();
    await groupMembersPage.checksIsDeleteConfirmationVisible('By removing');
    await groupMembersPage.approveConfirmation();
  });
});

test('checks reject confirmations for empty group', async ({ page, groupMembersPage }) => {
  await initAsTesterUser(page);
  await page.goto('/groups/by-id/672913018859223173;p=52767158366271444/members');
  await page.route(`${apiUrl}/groups/672913018859223173/children?types_exclude=Team,Session,User`, async route => {
    await route.fulfill({ json: groupChildrenJson });
  });

  await test.step('checks the group with children to be visible', async () => {
    await groupMembersPage.checksIsHeaderVisible(groupName);
    await groupMembersPage.goToTab('Sub-groups');
    await groupMembersPage.checksIsGroupWithCheckboxVisible('With no children');
  });

  await test.step('checks reject confirmations with offer to delete the group', async () => {
    await groupMembersPage.switchCheckbox('With no children');
    await groupMembersPage.removeCheckedFromGroup();
    await groupMembersPage.checksIsDeleteConfirmationVisible(/^Do you also want to delete the group\?$/);
    await groupMembersPage.rejectConfirmation();
    await groupMembersPage.checksIsDeleteConfirmationNotVisible(/^Do you also want to delete the group\?$/);
    await groupMembersPage.checksIsDeleteConfirmationVisible('By removing');
    await groupMembersPage.rejectConfirmation();
    await groupMembersPage.checksIsDeleteConfirmationNotVisible('By removing');
  });
});
