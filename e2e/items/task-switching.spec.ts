import { test, expect } from '@playwright/test';
import { initAsTesterUser } from '../helpers/e2e_auth';

/**
 * Check that we can switch between tasks (i.e., that the task unload rule when leaving a task does not block everything)
 */

test('activity with full route loads', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/1414822370876733593;p=4702,100575556387408660,1788359139685642917;pa=0');
  await page.locator('alg-neighbor-widget').getByTestId('nav-to-next').click();

  await expect.soft(page).toHaveURL(new RegExp('/a/1667741628301295500;p=4702,100575556387408660,1788359139685642917'));
});
