import { test, expect, Page } from './fixture';
import { initAsDemoUser, initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';
import { SECONDS } from 'src/app/utils/duration';

const groupName = 'E2EGroupInvitationProcess';
const groupId = '4433009959583369709';
const demoUserLogin = 'usr_5p020x2thuyu';

const extraTimeout = 60*SECONDS;

const sendGroupInvitation = async (page: Page) => {
  await page.goto(`/groups/by-id/${ groupId };p=/members`);
  await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Invite users' })).toBeVisible();
  await expect.soft(page.getByRole('textbox', { name: 'login_1, login_2...' })).toBeVisible();
  await page.getByRole('textbox', { name: 'login_1, login_2...' }).fill(demoUserLogin);
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect.soft(page.locator('alg-message').getByText(`user(s) invited successfully: ${ demoUserLogin }`)).toBeVisible();
};

const rejectGroupInvitation = async (page: Page) => {
  await page.goto('/groups/mine');
  await page.waitForResponse(`${apiUrl}/current-user/group-invitations`);
  await expect.soft(page.getByRole('heading', { name: 'My groups' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Pending invitations' })).toBeVisible();
  await expect.soft(page.getByRole('cell', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('reject-group')).toBeVisible();
  await page.getByRole('row', { name: groupName }).getByTestId('reject-group').click();
  await expect.soft(page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
};

test.beforeEach(async ({ page, minePage }) => {
  test.setTimeout(extraTimeout);
  await initAsDemoUser(page);
  await minePage.goto();
  await Promise.all([
    minePage.waitGroupInvitationsResponse(),
    minePage.waitGroupMembershipsResponse(),
  ]);
  await minePage.checkIsPendingInvitationsVisible();
  await minePage.checkJoinedGroupsSectionIsVisible();
  if (await minePage.isUserInvitedToGroup(groupName)) {
    await rejectGroupInvitation(page);
  } else if (await minePage.isUserJoinedToGroup(groupName)) {
    await minePage.leaveGroup(groupName);
  }
});

test.afterEach(async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto(`/groups/by-id/${ groupId };p=/members`);
  await page.waitForResponse(`${apiUrl}/groups/${ groupId }/members?limit=25`);
  await expect(page.locator('li').filter({ hasText: 'Users' })).toBeVisible();
  await expect(page.locator('alg-member-list')).not.toContainText(demoUserLogin);
});

test('Accept group invitation', { tag: '@no-parallelism' }, async ({ page, minePage }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
  });

  await test.step('Accept a group', async () => {
    await initAsDemoUser(page);
    await minePage.goto();
    await minePage.waitGroupInvitationsResponse();
    await minePage.checkIsPendingInvitationsVisible();
    if (await minePage.isUserInvitedToGroup(groupName)) {
      await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('accept-group')).toBeVisible();
      await page.getByRole('row', { name: groupName }).getByTestId('accept-group').click();
      await expect.soft(page.getByText('Joining a new group')).toBeVisible();
      await expect.soft(page.getByRole('button', { name: 'Join group' })).toBeVisible();
      await page.getByRole('button', { name: 'Join group' }).click();
      await expect.soft(page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
    } else {
      throw new Error('Failed to accept group invitation');
    }
  });

  await test.step('Check the user accepted group invitation in member list', async () => {
    await initAsUsualUser(page);
    await page.goto(`/groups/by-id/${ groupId };p=/members`);
    await page.waitForResponse(`${apiUrl}/groups/${ groupId }/members?limit=25`);
    await expect.soft(page.locator('alg-member-list').getByRole('link', { name: demoUserLogin })).toBeVisible();
  });

  await test.step('Leave a group', async () => {
    await initAsDemoUser(page);
    await minePage.goto();
    await minePage.waitGroupMembershipsResponse();
    await minePage.checkJoinedGroupsSectionIsVisible();
    await minePage.leaveGroup(groupName);
  });
});

test('Reject group invitation', { tag: '@no-parallelism' }, async ({ page }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
  });

  await test.step('Accept a group', async () => {
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
    await minePage.goto();
    await minePage.waitGroupInvitationsResponse();
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
