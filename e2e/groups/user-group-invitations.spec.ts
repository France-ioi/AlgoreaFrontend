import { test, expect, Page } from './fixture';
import { initAsDemoUser, initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

const groupName = 'E2EGroupInvitationProcess';
const groupId = '4433009959583369709';
const demoUserLogin = 'usr_5p020x2thuyu';

const loginsInputLocator = (page: Page) => page.getByRole('textbox', {
  name: 'logins of users to invite, separated by commas (e.g., login1, login2, ...)',
});

const sendGroupInvitation = async (page: Page) => {
  await page.goto(`/groups/by-id/${ groupId };p=/members`);
  await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Invitations' })).toBeVisible();
  await expect.soft(loginsInputLocator(page)).toBeVisible();
  await loginsInputLocator(page).fill(demoUserLogin);
  await Promise.all([
    page.getByRole('button', { name: 'Invite' }).click(),
    page.waitForResponse(`${apiUrl}/groups/${ groupId }/invitations`),
  ]);
  await expect.soft(page.locator('alg-message-info').getByText(`user(s) invited successfully: ${ demoUserLogin }`)).toBeVisible();
};

const checkMembersPageIsVisible = async (page: Page) => {
  await expect.soft(page.locator('.alg-nav-tab').getByRole('link', { name: 'Members' })).toBeVisible();
  await expect.soft(page.locator('alg-member-list')).toBeVisible();
};

const expectInvitationAcceptedToast = async (page: Page) => {
  await expect.soft(page.locator('alg-toast-messages', {
    hasText: `The ${ groupName } group has been accepted`,
  })).toBeVisible();
};

const waitForInvitationAction = (page: Page, action: 'accept' | 'reject') =>
  page.waitForResponse(response =>
    response.request().method() === 'POST'
    && response.url().includes(`/current-user/group-invitations/${ groupId }/${ action }`)
  );

const isDemoUserJoinedToGroup = async (page: Page): Promise<boolean> =>
  page.locator('alg-joined-group-list', { hasText: groupName }).getByRole('row', { name: groupName }).isVisible();

const expectInvitationDeclinedToast = async (page: Page) => {
  await expect.soft(page.locator('alg-toast-messages', {
    hasText: `The ${ groupName } group has been declined`,
  })).toBeVisible();
};

const rejectGroupInvitation = async (page: Page) => {
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
    waitForInvitationAction(page, 'reject'),
  ]);
  await expectInvitationDeclinedToast(page);
};

test.beforeEach(async ({ page, minePage }) => {
  await initAsDemoUser(page);
  await Promise.all([
    minePage.goto(),
    minePage.waitGroupInvitationsResponse(),
    minePage.waitGroupMembershipsResponse(),
  ]);
  await minePage.checkIsPendingInvitationsVisible();
  await minePage.checkJoinedGroupsSectionIsVisible();
  if (await minePage.isUserInvitedToGroup(groupName)) {
    await rejectGroupInvitation(page);
  } else if (await isDemoUserJoinedToGroup(page)) {
    await minePage.leaveGroup(groupName);
  }
});

test.afterEach(async ({ page }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto(`/groups/by-id/${ groupId };p=/members`),
    page.waitForResponse(`${apiUrl}/groups/${ groupId }/members?limit=26`),
  ]);
  await checkMembersPageIsVisible(page);
  await expect.soft(page.locator('alg-member-list')).not.toContainText(demoUserLogin);
});

test('Accept group invitation', { tag: '@no-parallelism' }, async ({ page, minePage }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
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
        waitForInvitationAction(page, 'accept'),
      ]);
      await expectInvitationAcceptedToast(page);
    } else {
      throw new Error('Failed to accept group invitation');
    }
  });

  await test.step('Check the user accepted group invitation in member list', async () => {
    await initAsUsualUser(page);
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

test('Reject group invitation', { tag: '@no-parallelism' }, async ({ page }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
  });

  await test.step('Reject invitation', async () => {
    await initAsDemoUser(page);
    await rejectGroupInvitation(page);
  });
});

test('Error on group invitations service', { tag: '@no-parallelism' }, async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/current-user/group-invitations`, route => route.abort());
  await page.goto('/groups/mine');
  await expect.soft(page.getByText('Error while loading the group invitations.')).toBeVisible();
});

test('Cancel "Joining a new group" modal', { tag: '@no-parallelism' }, async ({ page, minePage }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
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
