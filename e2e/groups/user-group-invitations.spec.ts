import { expect, Page, test } from '@playwright/test';
import { initAsDemoUser, initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

const groupName = 'E2EGroupInvitationProcess';
const groupId = '4433009959583369709';
const demoUserLogin = 'usr_5p020x2thuyu';

test.describe.configure({ mode: 'serial' });

const sendGroupInvitation = async (page: Page) => {
  await page.goto(`/groups/by-id/${ groupId };p=/members`);
  await expect.soft(page.getByRole('heading', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Invite users' })).toBeVisible();
  await expect.soft(page.getByRole('textbox', { name: 'login_1, login_2...' })).toBeVisible();
  await page.getByRole('textbox', { name: 'login_1, login_2...' }).fill(demoUserLogin);
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect.soft(page.locator('alg-message').getByText(`user(s) invited successfully: ${ demoUserLogin }`)).toBeVisible();
};

const leaveGroup = async (page: Page) => {
  await page.goto('/groups/mine');
  await page.waitForResponse(`${apiUrl}/current-user/group-memberships`);
  await expect.soft(page.getByRole('heading', { name: 'The groups you joined' })).toBeVisible();
  await expect.soft(
    page.locator('alg-joined-group-list', { hasText: groupName })
      .getByRole('row', { name: groupName })
      .getByRole('button')
  ).toBeVisible();
  await page.locator('alg-joined-group-list', { hasText: groupName })
    .getByRole('row', { name: groupName })
    .getByRole('button')
    .click();
  await page.getByRole('button', { name: 'Yes, leave group' }).click();
  await expect.soft(page.locator('p-toastitem', { hasText: `You have left "${ groupName }"` })).toBeVisible();
};

const isUserInvitedToGroup = async (page: Page) => {
  await page.goto('/groups/mine');
  await page.waitForResponse(`${apiUrl}/current-user/group-memberships`);
  await expect.soft(page.getByRole('heading', { name: 'Pending invitations' })).toBeVisible();
  return page.locator('alg-user-group-invitations').getByRole('cell', { name: groupName }).isVisible();
};

const isUserJoinedToGroup = async (page: Page) => {
  await page.goto('/groups/mine');
  await page.waitForResponse(`${apiUrl}/current-user/group-memberships`);
  await expect.soft(page.getByRole('heading', { name: 'The groups you joined' })).toBeVisible();
  return page.locator('alg-joined-group-list', { hasText: groupName })
    .getByRole('row', { name: groupName })
    .getByRole('button')
    .isVisible();
};

const rejectGroupInvitation = async (page: Page)=> {
  await page.goto('/groups/mine');
  await page.waitForResponse(`${apiUrl}/current-user/group-invitations`);
  await expect.soft(page.getByRole('heading', { name: 'My groups' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Pending invitations' })).toBeVisible();
  await expect.soft(page.getByRole('cell', { name: groupName })).toBeVisible();
  await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('reject-group')).toBeVisible();
  await page.getByRole('row', { name: groupName }).getByTestId('reject-group').click();
  await expect.soft(page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await initAsDemoUser(page);
  if (await isUserInvitedToGroup(page)) {
    await rejectGroupInvitation(page);
  } else if (await isUserJoinedToGroup(page)) {
    await leaveGroup(page);
  }
});

test.afterEach(async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto(`/groups/by-id/${ groupId };p=/members`);
  await page.waitForResponse(`${apiUrl}/groups/${ groupId }/members?limit=25`);
  await expect(page.locator('li').filter({ hasText: 'Users' })).toBeVisible();
  await expect(page.locator('alg-member-list')).not.toContainText(demoUserLogin);
});

test('Accept group invitation flow', async ({ page }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
  });

  await test.step('Accept a group', async () => {
    await initAsDemoUser(page);
    if (await isUserInvitedToGroup(page)) {
      await expect.soft(page.getByRole('row', { name: groupName }).getByTestId('accept-group')).toBeVisible();
      await page.getByRole('row', { name: groupName }).getByTestId('accept-group').click();
      await expect.soft(page.getByText('Accepting a invitation')).toBeVisible();
      await expect.soft(page.getByRole('button', { name: 'Join group' })).toBeVisible();
      await page.getByRole('button', { name: 'Join group' }).click();
      await expect.soft(await page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
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
    await leaveGroup(page);
  });
});

test('Reject group invitation', async ({ page }) => {
  await test.step('Invite user into group', async () => {
    await initAsUsualUser(page);
    await sendGroupInvitation(page);
  });

  await test.step('Accept a group', async () => {
    await initAsDemoUser(page);
    await rejectGroupInvitation(page);
  });
});

test('Error on group invitations service', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/current-user/group-invitations`, route => route.abort());
  await page.goto('/groups/mine');
  await expect.soft(page.getByText('Error while loading the group invitations.')).toBeVisible();
});
