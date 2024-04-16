import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

test.describe.configure({ mode: 'serial' });

test('Setting group turn on approval rules', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');
  await expect(page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
  await expect(page.getByText('Lock membership until a given date')).toBeVisible();
  await expect.soft(page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
  await page.getByTestId('switch-require-lock-until-enabled').click();
  await expect.soft(page.getByTestId('require-lock-until-datepicker')).toBeVisible();
  await expect(page.getByText('Managers can access member\'s personal information')).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'Read only' })).toBeVisible();
  await page.locator('li').filter({ hasText: 'Read only' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.soft(page.getByText('SuccessChanges successfully')).toBeVisible();
});

test('Setting group turn off approval rules', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/6688692310502473984;p=/settings');
  await expect(page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
  await expect(page.getByText('Lock membership until a given date')).toBeVisible();
  await expect.soft(page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
  await page.getByTestId('switch-require-lock-until-enabled').click();
  await expect.soft(page.getByTestId('require-lock-until-datepicker')).not.toBeVisible();
  await expect(page.getByText('Managers can access member\'s personal information')).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'No' })).toBeVisible();
  await page.locator('li').filter({ hasText: 'No' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.soft(page.getByText('SuccessChanges successfully')).toBeVisible();
});
