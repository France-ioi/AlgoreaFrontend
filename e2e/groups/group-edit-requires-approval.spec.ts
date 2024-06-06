import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { DAYS } from 'src/app/utils/duration';

test.describe.configure({ mode: 'serial' });

test('Turn on approval rules', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');

  await test.step('Checks the lock membership until a given date control is visible', async () => {
    await expect(page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
    await expect(page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
  });

  await test.step('Enable lock membership until a given date control and fill the date', async () => {
    await page.getByTestId('switch-require-lock-until-enabled').click();
    const inputDateLocator = page.getByTestId('input-date').getByRole('textbox');
    await expect.soft(inputDateLocator).toBeVisible();
    await inputDateLocator.fill(convertDateToString(new Date(Date.now() + DAYS)));
  });

  await test.step('Switch managers can access member\'s personal information to "Read only"', async () => {
    await expect(page.getByText('Managers can access member\'s personal information')).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Read only' })).toBeVisible();
    await page.locator('li').filter({ hasText: 'Read only' }).click();
  });

  await test.step('Save changes and wait notification of success', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.soft(page.getByText('SuccessChanges successfully')).toBeVisible();
  });
});

test('Turn off approval rules', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');

  await test.step('Checks the lock membership until a given date control is visible', async () => {
    await expect(page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
    await expect(page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
  });

  await test.step('Disable lock membership until a given date control and check it disappeared', async () => {
    await page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(page.getByTestId('require-lock-until-datepicker')).not.toBeVisible();
  });

  await test.step('Switch managers can access member\'s personal information to "No"', async () => {
    await expect(page.getByText('Managers can access member\'s personal information')).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'No' })).toBeVisible();
    await page.locator('li').filter({ hasText: 'No' }).click();
  });

  await page.getByRole('button', { name: 'Save' }).click();
  await expect.soft(page.getByText('SuccessChanges successfully')).toBeVisible();
});

test('Check invalid date validation', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');

  const inputDateLocator = page.getByTestId('input-date').getByRole('textbox');

  await test.step('Checks the lock membership until a given date control is visible', async () => {
    await expect(page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
    await expect(page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
  });

  await test.step('Enable lock membership until a given date control and fill invalid date', async () => {
    await page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(inputDateLocator).toBeVisible();
    await inputDateLocator.fill('21/05/2024 60:60');
    await expect.soft(page.getByText('Invalid date')).toBeVisible();
  });

  await test.step('Fill invalid time', async () => {
    await inputDateLocator.fill('32/05/2024 12:00');
    await expect.soft(page.getByText('Invalid date')).toBeVisible();
  });

  await test.step('Fill past date', async () => {
    const currentDate = new Date();
    await inputDateLocator.fill(convertDateToString(currentDate));
    await expect.soft(page.getByText(`The date must be grater than: ${ convertDateToString(currentDate) }`)).toBeVisible();
  });

  await test.step('Clear invalid date and check validation message is gone', async () => {
    await inputDateLocator.fill('');
    await expect.soft(page.getByTestId('input-date').getByPlaceholder('dd/mm/yyyy hh:mm')).toBeVisible();
    await page.getByText('Lock membership until a given date').click();
    await expect.soft(page.getByText('Invalid date')).not.toBeVisible();
  });
});
