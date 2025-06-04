import { test, expect } from 'e2e/groups/create-group-fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

const userName = 'e2e-tests';
const removeManagersConfirmationMessage = 'Are you sure to remove';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

test('checks remove group managers', async ({ page, createGroup, groupManagersPage }) => {
  if (!createGroup) throw new Error('The group is not created');
  await page.goto(`/groups/by-id/${ createGroup?.groupId };p=/managers`);
  await groupManagersPage.checksIsGroupManagersTableVisible();
  await groupManagersPage.switchCheckbox(userName);
  await groupManagersPage.checksIsRemoveGroupManagersBtnVisible();

  await test.step('checks reject confirmation modal action', async () => {
    await groupManagersPage.removeSelectedManagers();
    await groupManagersPage.checksIsDeleteConfirmationVisible(removeManagersConfirmationMessage);
    await groupManagersPage.rejectConfirmation();
    await groupManagersPage.checksIsDeleteConfirmationNotVisible(removeManagersConfirmationMessage);
    await groupManagersPage.switchIsManagerRowVisible(userName);
  });

  await test.step('checks approve confirmation modal action', async () => {
    await groupManagersPage.removeSelectedManagers();
    await groupManagersPage.checksIsDeleteConfirmationVisible(removeManagersConfirmationMessage);
    await groupManagersPage.approveConfirmation();
    await groupManagersPage.checksIsDeleteConfirmationNotVisible(removeManagersConfirmationMessage);
    await expect.soft(page.getByText('This group has no dedicated managers.')).toBeVisible();
  });
});
