import { test, expect } from './fixture';
import { initAsTesterUser, initAsUsualUser } from '../helpers/e2e_auth';

test('checks no access message', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('a/1625159049301502151;p=4702;a=0/parameters');
  await expect.soft(page.getByText('You do not have the permissions to edit this content.')).toBeVisible();
});

test('checks edit parameters components are visible', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/6707691810849260111;p=;a=0/parameters');
  await expect.soft(page.getByText('Information')).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Information' })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Score & Validation' })).toBeVisible();
});

// currently disabled as settings for teams is currently hidden
test.skip('checks edit parameters teams size input', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/6707691810849260111;p=;a=0/parameters');
  const teamBlockLocator = page.getByTestId('edit-team-section');
  const targetBlockLocator = teamBlockLocator.filter({ hasText: 'Participation as a team (only)' });
  const inputBlockLocator = targetBlockLocator.locator('div').filter({ hasText: 'Maximum team size' });

  await test.step('checks the number input of team size are visible', async () => {
    await expect.soft(page.getByRole('heading', { name: 'Team' })).toBeVisible();
    await expect.soft(teamBlockLocator).toBeVisible();
    await expect.soft(targetBlockLocator).toBeVisible();
    const switchLocator = targetBlockLocator.locator('alg-switch');
    await expect.soft(switchLocator).toBeVisible();
    await switchLocator.click();
    await expect.soft(inputBlockLocator).toBeVisible();
  });

  await test.step('checks the number input fill and validation', async () => {
    const inputNumberLocator = inputBlockLocator.locator('alg-input-number').getByRole('textbox');
    await expect.soft(inputNumberLocator).toBeVisible();
    const validationMessageLocator = inputBlockLocator.getByText('Invalid value, minimum: 1');
    await expect.soft(validationMessageLocator).toBeVisible();
    await inputNumberLocator.fill('10');
    await expect.soft(validationMessageLocator).not.toBeVisible();
  });
});
