import { test } from '../common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { expect } from 'e2e/groups/create-group-fixture';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem, deleteGroup }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

test('grant view permission', async ({
  page,
  createItem,
  createGroup,
  itemContentPage,
  editPermissionsModal,
  groupSettingsPage,
}) => {
  if (!createGroup) throw new Error('The group is not created');
  if (!createItem) throw new Error('The item is not created');
  await groupSettingsPage.goto(`/groups/by-id/${ createGroup.groupId };p=/settings`);
  await expect.soft(page.getByRole('heading', { name: createGroup.groupName })).toBeVisible();

  await test.step('checks is associated activity section visible', async () => {
    await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
    await groupSettingsPage.checksIsAssociatedActivitySearchInputVisible();
  });

  await test.step('search and select exist content', async () => {
    await groupSettingsPage.searchAndSelectAssociatedActivity(createItem.itemName);
  });

  await test.step('save group data', async () => {
    await Promise.all([
      groupSettingsPage.saveChangesAndCheckNotification(),
      groupSettingsPage.waitForGroupResponse(createGroup.groupId),
    ]);
  });

  await test.step('checks grant content access for item', async () => {
    await page.goto(`/a/${createItem.itemId};p=${rootItemId};pa=0?watchedGroupId=${createGroup.groupId}`);
    await editPermissionsModal.openPermissionsBlock();
    const grantAccessBtnLocator = page.getByRole('button', { name: 'Grant content access' });
    await expect.soft(grantAccessBtnLocator).toBeVisible();
    await grantAccessBtnLocator.click();
    await expect.soft(grantAccessBtnLocator).toBeDisabled();
    await itemContentPage.checkToastNotification('SuccessPermissions successfully updated.');
    await editPermissionsModal.openPermissionsBlock();
    await expect.soft(grantAccessBtnLocator).not.toBeVisible();
  });
});
