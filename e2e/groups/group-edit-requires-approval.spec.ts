import { test, expect } from './fixture';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';

test.beforeEach(async ({ page, groupSettingsPage }) => {
  await initAsUsualUser(page);
  await groupSettingsPage.goto('/groups/by-id/6688692310502473984;p=/settings');

  await test.step('checks the required approvals section is visible', async () => {
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
});

test('turn on and turn off approval rules', { tag: '@no-parallelism' }, async ({ page, groupSettingsPage }) => {
  await initAsUsualUser(page);
  await groupSettingsPage.goto('/groups/by-id/6688692310502473984;p=/settings');

  await test.step('checks the required approvals section is visible', async () => {
    await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
  });

  await test.step('enable lock membership until a given date control and fill the date', async () => {
    await groupSettingsPage.enableLockMembershipUntilInputDate();
    await groupSettingsPage.fillDate(convertDateToString(new Date(Date.now() + DAYS)));
  });

  await test.step('switch managers can access member\'s personal information to "Read only"', async () => {
    await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('Read only');
  });

  await test.step('save changes and wait notification of success', async () => {
    await groupSettingsPage.saveChanges();
  });

  await test.step('checks the required approvals section is visible', async () => {
    await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
  });

  await test.step('disable lock membership until a given date control and check it disappeared', async () => {
    await groupSettingsPage.disableLockMembershipUntilInputDate();
  });

  await test.step('switch managers can access member\'s personal information to "No"', async () => {
    await groupSettingsPage.selectManagersCanAccessMemberPersonalInformation('No');
  });

  await test.step('save changes and wait notification of success', async () => {
    await groupSettingsPage.saveChanges();
  });
});

test('check invalid date validation', { tag: '@no-parallelism' },async ({ page, browser, groupSettingsPage }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');

  await test.step('checks the required approvals section is visible', async () => {
    await groupSettingsPage.checkRequiredApprovalsSectionIsVisible();
  });

  await test.step('enable lock membership until a given date control', async () => {
    await groupSettingsPage.enableLockMembershipUntilInputDate();
  });

  if (browser.browserType().name() === 'chromium') {
    await test.step('checks invalid time in Chrome', async () => {
      await groupSettingsPage.fillDate('21/05/2024 60:60');
      await expect.soft(page.getByText('Invalid date')).toBeVisible();
    });
  }

  await test.step('fill invalid time', async () => {
    await groupSettingsPage.fillDate('32/05/2024 12:00');
    await expect.soft(page.getByText('Invalid date')).toBeVisible();
  });

  await test.step('fill past date', async () => {
    const currentDate = new Date();
    await groupSettingsPage.fillDate(convertDateToString(currentDate));
    await expect.soft(page.getByText(`The date must be greater than: ${ convertDateToString(currentDate) }`)).toBeVisible();
  });

  await test.step('clear invalid date and check validation message is gone', async () => {
    await groupSettingsPage.fillDate('');
    await expect.soft(page.getByTestId('input-date').getByPlaceholder('dd/mm/yyyy hh:mm')).toBeVisible();
    await page.getByText('Lock membership until a given date').click();
    await expect.soft(page.getByText('Invalid date')).not.toBeVisible();
  });
});
