import { test, expect } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test('checks scroll to in left menu', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('groups/by-id/117532200658920233;p=');
  await expect.soft(page.locator('p-treenode').getByText('ThreadTest')).toBeInViewport();
});
