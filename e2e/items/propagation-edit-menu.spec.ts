import { test, expect } from '@playwright/test';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

test('checks propagation edit menu', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/899800937596940136;p=;pa=0/edit-children');
  await expect.soft(page.getByTestId('item-title')).toHaveText('4LA 1ère année UE Informatique');
  const targetTdLocator = page.getByRole('row').filter({ has: page.getByText('CC1') });
  await expect.soft(targetTdLocator).toBeVisible();
  const menuButtonLocator = targetTdLocator.getByRole('button');
  await expect.soft(menuButtonLocator).toBeVisible();
  await menuButtonLocator.click();
  const propagationEditMenuLocator = page.locator('alg-propagation-edit-menu');
  await expect.soft(propagationEditMenuLocator.getByText('Default access')).toBeVisible();
  await expect.soft(propagationEditMenuLocator.getByText('Locked', { exact: true })).toBeDisabled();
});
