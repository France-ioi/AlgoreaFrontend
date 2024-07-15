import { test } from './fixture';
import { initAsDemoUser, initAsUsualUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';
import { expect } from 'e2e/groups/fixture';
import { extraGroupInvitationsTimeout } from 'e2e/groups/pages/mine-page';

const groupUrl = '/groups/by-id/612953395334966729;p=/settings';
const groupName = 'E2EStrengthenedApprovalConditions';
const code = '6cx6ycddy4';

test.beforeEach(async ({ page, groupSettingsPage, minePage }) => {
  test.setTimeout(extraGroupInvitationsTimeout);
  await initAsUsualUser(page);
  await groupSettingsPage.goto(groupUrl);

  await test.step('checks is required approvals section visible', async () => {
    await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
  });

  await test.step('checks if any required approvals enabled then turns it off', async () => {
    const isLockMembershipInputDateEnabled = await groupSettingsPage.isLockMembershipInputDateVisible();
    const isManagersCanAccessMemberPersonalInformationEnabled
      = !await groupSettingsPage.isManagersCanAccessMemberPersonalInformationSelected('No');

    if (isLockMembershipInputDateEnabled) {
      await groupSettingsPage.disableLockMembershipUntilInputDate();
    }

    if (isManagersCanAccessMemberPersonalInformationEnabled) {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('No');
    }

    if (isLockMembershipInputDateEnabled || isManagersCanAccessMemberPersonalInformationEnabled) {
      await groupSettingsPage.saveChangesAndCheckNotification();
    }
  });

  await test.step('checks if demo user is member of group then do leave it', async () => {
    await initAsDemoUser(page);
    await minePage.goto();
    await minePage.waitGroupMembershipsResponse();
    await minePage.checkHeaderIsVisible();
    await minePage.checkJoinedGroupsSectionIsVisible();
    if (await minePage.isUserJoinedToGroup(groupName)) {
      await minePage.leaveGroup(groupName);
    }
  });
});

test.afterEach(async ({ page, groupSettingsPage, minePage }) => {
  await initAsUsualUser(page);
  await groupSettingsPage.goto(groupUrl);

  await test.step('checks is required approvals section visible', async () => {
    await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
  });

  await test.step('checks if any required approvals enabled then turns it off', async () => {
    const isLockMembershipInputDateEnabled = await groupSettingsPage.isLockMembershipInputDateVisible();
    const isManagersCanAccessMemberPersonalInformationEnabled
      = !await groupSettingsPage.isManagersCanAccessMemberPersonalInformationSelected('No');

    if (isLockMembershipInputDateEnabled) {
      await groupSettingsPage.disableLockMembershipUntilInputDate();
    }

    if (isManagersCanAccessMemberPersonalInformationEnabled) {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('No');
    }

    if (isLockMembershipInputDateEnabled || isManagersCanAccessMemberPersonalInformationEnabled) {
      await groupSettingsPage.saveChangesAndCheckNotification();
    }
  });

  await test.step('checks if demo user is member of group then do leave it', async () => {
    await initAsDemoUser(page);
    await minePage.goto();
    await minePage.waitGroupMembershipsResponse();
    await minePage.checkHeaderIsVisible();
    await minePage.checkJoinedGroupsSectionIsVisible();
    if (await minePage.isUserJoinedToGroup(groupName)) {
      await minePage.leaveGroup(groupName);
    }
  });
});

test(
  'checks strengthened confirmation and remove members',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
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

    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

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
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
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

    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

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

    /***
      Because of unstable work of BE response of group invitations, temporary skip the next test steps
      with group invitation request.
      To be removed after BE to be fixed.
    **/
    test.skip(true, 'skips next test steps with group invitations request');

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
      await expect.soft(page.getByText(`SuccessThe ${ groupName } group has`)).toBeVisible();
      await minePage.goto();
      await minePage.waitGroupMembershipsResponse();
      await minePage.checkJoinedGroupsSectionIsVisible();
      await minePage.checkJoinedGroupIsVisible(groupName);
    });
  });

test(
  'checks cancel strengthened confirmation',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
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

    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

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
