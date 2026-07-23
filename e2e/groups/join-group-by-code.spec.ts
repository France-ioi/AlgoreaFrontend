import { test } from './create-group-fixture';
import { initAsDemoUser, initAsTesterUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';

// Create + join + empty members + delete exceeds the default 30s budget.
test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

// Demo user invitations/memberships are shared mutable state across these tests.
test(
  'checks join group by code with "Lock membership until a given date" required approval',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('checks is required approvals section visible', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChangesAndCheckNotification();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks open join group confirmation and switch "agree with lock membership"', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithLockMembership();
    });

    await test.step('join to group and check is demo user member of joined group', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });

    await test.step('checks is group locked to leave', async () => {
      await minePage.checkGroupIsLockToLeave(groupName);
    });
  });

test(
  'checks join group by code with "Managers can access member\'s personal information" required approval',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('checks the required approvals section is visible', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChangesAndCheckNotification();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks open join group confirmation and switch agree with personal info view', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithPersonalInfoView();
    });

    await test.step('join to group and check is demo user member of joined group', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });
  });

test(
  'checks join group by code with all required approvals',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('checks the required approvals section is visible', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('enable "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('Select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('Save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChangesAndCheckNotification();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('Open join group confirmation and switch all options', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithLockMembership();
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithPersonalInfoView();
    });

    await test.step('Join group and check group in joined groups table', async () => {
      await joinGroupConfirmation.joinGroup();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });
  });

test(
  'checks cancel join group confirmation modal',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation, createGroup }) => {
    if (!createGroup) throw new Error('The group is not created');
    const { groupId, groupName } = createGroup;

    const code = await test.step('generate join code', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/members`);
      return groupSettingsPage.generateJoinCode();
    });

    await test.step('checks the required approvals section is visible', async () => {
      await groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`);
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChangesAndCheckNotification();
    });

    await test.step('join by code from demo user', async () => {
      await initAsDemoUser(page);
      await minePage.goto();
      await minePage.checkHeaderIsVisible();
      await minePage.checkJoinByCodeIsVisible();
      await minePage.joinByCode(code);
    });

    await test.step('checks join group confirmation modal and switch all options', async () => {
      await joinGroupConfirmation.checkHeaderIsVisible();
      await joinGroupConfirmation.checkMessageIsVisible(groupName);
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithLockMembership();
      await joinGroupConfirmation.checkJoinGroupBtnIsDisabled();
      await joinGroupConfirmation.switchAgreeWithPersonalInfoView();
    });

    await test.step('cancel join group confirmation modal', async () => {
      await joinGroupConfirmation.cancel();
      await joinGroupConfirmation.checkHeaderIsNotVisible();
    });
  });
