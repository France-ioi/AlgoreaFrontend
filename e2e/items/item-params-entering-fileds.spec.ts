import { expect, test } from '@playwright/test';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';
import { convertDateToString } from 'src/app/utils/input-date';

test('checks entering date fields in item permissions', async ({ page }) => {
  await initAsTesterUser(page);
  const firstAllowedEnteringTimeLocator = page.getByText('First allowed entering time');
  const latestAllowedEnteringTimeLocator = page.getByText('Latest allowed entering time');
  const enteringTimeMinContainerLocator = page.getByTestId('entering-time-min-container');
  const enteringTimeMinSwitchLocator = page.getByTestId('entering-time-min-container').locator('alg-switch');
  const enteringTimeMaxSwitchLocator = page.getByTestId('entering-time-max-container').locator('alg-switch');
  const enteringTimeMinInputDateLocator = enteringTimeMinContainerLocator
    .locator('alg-input-date')
    .getByTestId('input-date')
    .getByRole('textbox');
  const enteringTimeMaxContainerLocator = page.getByTestId('entering-time-max-container');
  const enteringTimeMaxInputDateLocator = enteringTimeMaxContainerLocator
    .locator('alg-input-date')
    .getByTestId('input-date')
    .getByRole('textbox');

  await test.step('checks entering date fields are visible', async () => {
    await page.goto('a/4892052901432763219;p=3244687538937221949;pa=0/parameters');
    await page.waitForResponse(`${apiUrl}/items/4892052901432763219/attempts?parent_attempt_id=0`);
    await expect.soft(page.getByTestId('item-title').getByText('Entering Fields')).toBeVisible();
    await expect.soft(firstAllowedEnteringTimeLocator).toBeVisible();
    await expect.soft(latestAllowedEnteringTimeLocator).toBeVisible();
    await expect.soft(enteringTimeMinSwitchLocator).toBeVisible();
    await enteringTimeMinSwitchLocator.click();
    await expect.soft(enteringTimeMinInputDateLocator).toBeVisible();
    await expect.soft(enteringTimeMaxSwitchLocator).toBeVisible();
    await enteringTimeMaxSwitchLocator.click();
    await expect.soft(enteringTimeMaxInputDateLocator).toBeVisible();
  });

  await test.step('checks entering date fields validation', async () => {
    await enteringTimeMaxInputDateLocator.fill('01/01/2024 22:22');
    await expect.soft(
      enteringTimeMaxContainerLocator.getByText(`The date must be greater than: ${ convertDateToString(new Date()) }`)
    ).toBeVisible();
    await enteringTimeMinInputDateLocator.fill('33/33/3033 22:22');
    await expect.soft(enteringTimeMinContainerLocator.getByText('Invalid date')).toBeVisible();
    await enteringTimeMaxInputDateLocator.fill('33/33/3033 22:22');
    await expect.soft(enteringTimeMaxContainerLocator.getByText('Invalid date')).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.soft(page.getByText('You need to solve all the errors displayed in the form to save changes.')).toBeVisible();
  });

});
