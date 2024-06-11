import { test } from './fixture';
import { initAsDemoUser, initAsUsualUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';

const groupUrl = '/groups/by-id/7603612676907243141;p=/settings';
const groupName = 'E2EJoinByCode';
const code = '8mp35xuh6f';

test.beforeEach(async ({ page, groupSettingsPage, minePage }) => {
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
      await groupSettingsPage.saveChanges();
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
      await groupSettingsPage.saveChanges();
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
  'checks join group by code with "Lock membership until a given date" required approval',
  { tag: '@no-parallelism' },
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

    await test.step('checks is required approvals section visible', async () => {
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('turns on "Lock membership until a given date" control and fill the date', async () => {
      await groupSettingsPage.enableLockMembershipUntilInputDate();
      await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
    });

    await test.step('save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChanges();
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
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

    await test.step('checks the required approvals section is visible', async () => {
      await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
    });

    await test.step('select "Managers can access member\'s personal information" to "Read only"', async () => {
      await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
    });

    await test.step('save changes and wait notification of success', async () => {
      await groupSettingsPage.saveChanges();
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
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

    await test.step('checks the required approvals section is visible', async () => {
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
      await groupSettingsPage.saveChanges();
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
  async ({ page, groupSettingsPage, minePage, joinGroupConfirmation }) => {
    await initAsUsualUser(page);
    await groupSettingsPage.goto(groupUrl);

    await test.step('checks the required approvals section is visible', async () => {
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
      await groupSettingsPage.saveChanges();
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
