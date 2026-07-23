import { test, expect } from './create-group-fixture';
import { initAsDemoUser, initAsTesterUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';

// Create + join + strengthen + empty members + delete exceeds the default 30s budget.
test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

// Demo user invitations/memberships are shared mutable state across these tests.
test(
  'checks strengthened confirmation and remove members',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code as tester', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks open join group confirmation', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
    });

    await test.step('join to group and check is demo user member of joined group', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });

    await initAsTesterUser(page);
    await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);

    await test.step('checks is required approvals section visible', async () => {
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('checks strengthened approval confirmation appears', async () => {
      await groupSettingsPage.saveChanges();
      await groupSettingsPage.checkIsStrengthenedApprovalConfirmationVisible();
      await groupSettingsPage.checkIsStrengthenedConfirmationCancelBtnVisible();
      await groupSettingsPage.selectStrengthenedConfirmationOperation('Remove all members');
      await groupSettingsPage.checkSuccessfulNotification();
    });
  });

test(
  'checks strengthened confirmation and re-invite members',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code as tester', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks open join group confirmation', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
    });

    await test.step('join to group and check is demo user member of joined group', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });

    await initAsTesterUser(page);
    await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);

    await test.step('checks is required approvals section visible', async () => {
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('checks strengthened approval confirmation appears', async () => {
      await groupSettingsPage.saveChanges();
      await groupSettingsPage.checkIsStrengthenedApprovalConfirmationVisible();
      await groupSettingsPage.checkIsStrengthenedConfirmationCancelBtnVisible();
      await groupSettingsPage.selectStrengthenedConfirmationOperation('Remove and re-invite all members');
      await groupSettingsPage.checkSuccessfulNotification();
    });

    await test.step('checks is demo user invited to group', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.waitGroupInvitationsResponse();
      await minePage.checkHeaderIsVisible();
      await minePage.checkIsUserInvitedToGroupVisible(groupName);
    });

    await test.step('accept group invitation', async () => {
      await minePage.acceptGroupInvitation(groupName);
    });

    await test.step('open join group confirmation and switch all options', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithLockMembership();
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithPersonalInfoView();
    });

    await test.step('join group and check group in joined groups table', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await expect.soft(page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });
  });

test(
  'checks cancel strengthened confirmation',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code as tester', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks open join group confirmation', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
    });

    await test.step('join to group and check is demo user member of joined group', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });

    await initAsTesterUser(page);
    await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);

    await test.step('checks is required approvals section visible', async () => {
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('checks strengthened approval confirmation appears', async () => {
      await groupSettingsPage.saveChanges();
      await groupSettingsPage.checkIsStrengthenedApprovalConfirmationVisible();
      await groupSettingsPage.checkIsStrengthenedConfirmationCancelBtnVisible();
      await groupSettingsPage.selectStrengthenedConfirmationOperation('Cancel');
    });
  });
