import { test } from 'e2e/groups/create-group-fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

const managerName = 'e2e-tests';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

test('checks group edit permissions confirmation modal', async ({
  createGroup,
  page,
  groupManagersPage,
  groupEditPermissionsModal,
}) => {
  if (!createGroup) throw new Error('The group is not created');
  await page.goto(`groups/by-id/${ createGroup.groupId };p=/managers`);

  await test.step('checks open permissions edit modal', async () => {
    await groupManagersPage.checksIsGroupManagersTableVisible();
    await groupManagersPage.switchIsManagerRowVisible(managerName);
    await groupManagersPage.openEditPermissionsModal(managerName);
  });

  await test.step('checks select option and confirmation modal', async () => {
    await groupEditPermissionsModal.checksIsPermissionsModalVisible(createGroup.groupName, managerName);
    await groupEditPermissionsModal.isSavePermissionsBtnDisabled();
    await groupEditPermissionsModal.selectOption('Management level', 'Read-only');
    await groupEditPermissionsModal.isSavePermissionsBtnEnabled();
    await groupEditPermissionsModal.savePermissions();
    await groupEditPermissionsModal.isConfirmationModalVisible();
  });

  await test.step('checks reject confirmation', async () => {
    await groupEditPermissionsModal.rejectConfirmation();
    await groupEditPermissionsModal.isConfirmationModalNotVisible();
  });

  await test.step('checks accept confirmation', async () => {
    await groupEditPermissionsModal.savePermissions();
    await groupEditPermissionsModal.isConfirmationModalVisible();
    await groupEditPermissionsModal.approveConfirmation();
    await groupEditPermissionsModal.checksIsPermissionsModalNotVisible();
  });

});
