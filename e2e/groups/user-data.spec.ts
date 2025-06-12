import { test } from './fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

test('checks current user profile', async ({ page, userPage }) => {
  await initAsUsualUser(page);

  await test.step('checks tabs is visible', async () => {
    await Promise.all([
      userPage.goto('/groups/users/670968966872011405'),
      userPage.waitForLogsResponse(),
    ]);
    await userPage.checksIsHeaderVisible('Armelle Bonenfant (arbonenfant)');
    await userPage.checksIsTabVisible('Personal data');
  });

  await test.step('checks content under tabs are visible', async () => {
    await userPage.checksIsProgressTableVisible();
    await userPage.goToTab('Personal data');
    await userPage.checksIsModifyButtonVisible();
    await userPage.checksIsCurrentUserIntroHeaderVisible();
    await userPage.checksIsLoginVisible('arbonenfant');
    await userPage.checksIsFirstnameVisible('Armelle');
    await userPage.goToTab('Settings');
    await userPage.checksIsPlatformLanguageVisible();
  });
});

test('checks other\'s user profile (cannot view personal info)', async ({ page, userPage }) => {
  await initAsUsualUser(page);

  await test.step('checks tabs is not visible', async () => {
    await Promise.all([
      userPage.goto('/groups/users/6351969043660203734'),
      userPage.waitForLogsResponse('6351969043660203734'),
    ]);
    await userPage.checksIsHeaderVisible('user-no-access');
    await userPage.checksIsTabNotVisible('Personal data');
  });

  await test.step('checks progress table is visible', async () => {
    await userPage.checksIsProgressTableVisible();
  });

  await test.step('checks landing to personal info tab ', async () => {
    await userPage.goto('/groups/users/6351969043660203734/personal-data');
    await userPage.checksIsTabVisible('Personal data');
    await userPage.checksIsNotViewableUserIntroHeaderVisible();
    await userPage.checksIsLoginVisible('user-no-access');
    await userPage.checksIsFirstnameNotVisible();

    await userPage.goToTab('Progress');
    await userPage.waitForLogsResponse('6351969043660203734');
    await userPage.checksIsTabNotVisible('Personal data');
    await userPage.checksIsProgressTableVisible();
  });
});

test('checks other\'s user profile with can view personal data access', async ({ page, userPage }) => {
  await initAsUsualUser(page);

  await test.step('checks tabs is not visible', async () => {
    await userPage.goto('/groups/users/1729018577320222812/personal-data');
    await userPage.checksIsHeaderVisible('user-view-access');
    await userPage.checksIsTabVisible('Personal data');
    await userPage.checksIsViewableUserIntroHeaderVisible();
    await userPage.checksIsLoginVisible('user-view-access');
    await userPage.checksIsFirstnameVisible(null);
  });

  await test.step('checks "Modify password" is not visible', async () => {
    await userPage.checksIsModifyPasswordBtnNotVisible();
  });

  await test.step('checks progress table is visible', async () => {
    await userPage.goToTab('Progress');
    await userPage.waitForLogsResponse('1729018577320222812');
    await userPage.checksIsProgressTableVisible();
    await userPage.checksIsTabVisible('Personal data');
  });
});

test('checks other\'s user profile "Modify password"', async ({ page, userPage }) => {
  await initAsUsualUser(page);

  await test.step('checks "Modify password" is visible', async () => {
    await userPage.goto('/groups/users/8835235193558181696/personal-data');
    await userPage.checksIsHeaderVisible('user-edit-access');
    await userPage.checksIsTabVisible('Personal data');
    await userPage.checksIsModifyPasswordBtnVisible();
    await userPage.checksIsEditableUserIntroHeaderVisible();
    await userPage.checksIsLoginVisible('user-edit-access');
    await userPage.checksIsFirstnameVisible(null);
  });

  await test.step('checks progress table is visible', async () => {
    await userPage.goToTab('Progress');
    await userPage.waitForLogsResponse('8835235193558181696');
    await userPage.checksIsProgressTableVisible();
    await userPage.checksIsTabVisible('Personal data');
  });
});
