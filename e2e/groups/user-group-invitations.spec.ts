import { test, expect, Page } from './create-group-fixture';
import { initAsDemoUser, initAsTesterUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

const demoUserLogin = 'usr_5p020x2thuyu';

// Create + invite + demo actions + empty members + delete exceeds the default 30s budget.
test.setTimeout(60_000);

const checkMembersPageIsVisible = async (page: Page): Promise<void> => {
  await expect.soft(page.locator('.alg-nav-tab').getByRole('link', { name: 'Members' })).toBeVisible();
  await expect.soft(page.locator('alg-member-list')).toBeVisible();
};

const expectInvitationAcceptedToast = async (page: Page, groupName: string): Promise<void> => {
  await expect.soft(page.locator('alg-toast-messages', {
    hasText: `The ${ groupName } group has been accepted`,
  })).toBeVisible();
};

const waitForInvitationAction = (page: Page, groupId: string, action: 'accept' | 'reject'): ReturnType<Page['waitForResponse']> =>
  page.waitForResponse(response =>
    response.request().method() === 'POST'
    && response.url().includes(`/current-user/group-invitations/${ groupId }/${ action }`)
  );

const expectInvitationDeclinedToast = async (page: Page, groupName: string): Promise<void> => {
  await expect.soft(page.locator('alg-toast-messages', {
    hasText: `The ${ groupName } group has been declined`,
  })).toBeVisible();
};

const rejectGroupInvitation = async (page: Page, groupId: string, groupName: string): Promise<void> => {
  await Promise.all([
    page.goto('/groups/mine'),
    page.waitForResponse(`${apiUrl}/current-user/group-invitations`),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'My groups' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Pending invitations' })).toBeVisible();
  await expect.soft(page.getByRole('cell', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('reject-group')).toBeVisible();
  await Promise.all([
    page.getByRole('row', { name: groupName }).getByTestId('reject-group').click(),
    waitForInvitationAction(page, groupId, 'reject'),
  ]);
  await expectInvitationDeclinedToast(page, groupName);
};

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

// Demo user invitations/memberships are shared mutable state across these tests.
test('Accept group invitation', { tag: '@no-parallelism' }, async ({ page, minePage, groupMembersPage, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  const { groupId, groupName } = createGroup;

  await test.step('Invite user into group', async () => {
    await page.goto(`/groups/by-id/${ groupId };p=/members`);
    await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
    await groupMembersPage.inviteUser(demoUserLogin, groupId);
  });

  await test.step('Accept a group', async () => {
    await initAsDemoUser(page);
    await Promise.all([
      minePage.goto(),
      minePage.waitGroupInvitationsResponse(),
    ]);
    await minePage.checkIsPendingInvitationsVisible();
    if (await minePage.isUserInvitedToGroup(groupName)) {
      await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('accept-group')).toBeVisible();
      await page.getByRole('row', { name: groupName }).getByTestId('accept-group').click();
      await expect.soft(page.getByText('Joining a new group')).toBeVisible();
      await expect.soft(page.getByRole('button', { name: 'Join group' })).toBeVisible();
      await Promise.all([
        page.getByRole('button', { name: 'Join group' }).click(),
        waitForInvitationAction(page, groupId, 'accept'),
      ]);
      await expectInvitationAcceptedToast(page, groupName);
    } else {
      throw new Error('Failed to accept group invitation');
    }
  });

  await test.step('Check the user accepted group invitation in member list', async () => {
    await initAsTesterUser(page);
    await Promise.all([
      page.goto(`/groups/by-id/${ groupId };p=/members`),
      page.waitForResponse(`${apiUrl}/groups/${ groupId }/members?limit=26`),
    ]);
    await checkMembersPageIsVisible(page);
    await expect.soft(page.locator('alg-member-list').getByRole('link', { name: demoUserLogin })).toBeVisible();
  });

  await test.step('Leave a group', async () => {
    await initAsDemoUser(page);
    await Promise.all([
      minePage.goto(),
      minePage.waitGroupMembershipsResponse(),
    ]);
    await minePage.checkJoinedGroupsSectionIsVisible();
    await minePage.leaveGroup(groupName);
  });
});

test('Reject group invitation', { tag: '@no-parallelism' }, async ({ page, groupMembersPage, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  const { groupId, groupName } = createGroup;

  await test.step('Invite user into group', async () => {
    await page.goto(`/groups/by-id/${ groupId };p=/members`);
    await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
    await groupMembersPage.inviteUser(demoUserLogin, groupId);
  });

  await test.step('Reject invitation', async () => {
    await initAsDemoUser(page);
    await rejectGroupInvitation(page, groupId, groupName);
  });
});

test('Error on group invitations service', { tag: '@no-parallelism' }, async ({ page, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  await page.route(`${apiUrl}/current-user/group-invitations`, route => route.abort());
  await page.goto('/groups/mine');
  await expect.soft(page.getByText('Error while loading the group invitations.')).toBeVisible();
});

test('Cancel "Joining a new group" modal', { tag: '@no-parallelism' }, async ({ page, minePage, groupMembersPage, createGroup }) => {
  if (!createGroup) throw new Error('The group is not created');
  const { groupId, groupName } = createGroup;

  await test.step('Invite user into group', async () => {
    await page.goto(`/groups/by-id/${ groupId };p=/members`);
    await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
    await groupMembersPage.inviteUser(demoUserLogin, groupId);
  });

  await test.step('Open "Joining a new group" modal and do cancel', async () => {
    await initAsDemoUser(page);
    await Promise.all([
      minePage.goto(),
      minePage.waitGroupInvitationsResponse(),
    ]);
    await minePage.checkIsPendingInvitationsVisible();
    if (await minePage.isUserInvitedToGroup(groupName)) {
      await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('accept-group')).toBeVisible();
      await page.getByRole('row', { name: groupName }).getByTestId('accept-group').click();
      await expect.soft(page.getByText('Joining a new group')).toBeVisible();
      await expect.soft(page.getByRole('button', { name: 'Join group' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('accept-group')).toBeVisible();
    } else {
      throw new Error('Failed to accept group invitation');
    }
  });
});
