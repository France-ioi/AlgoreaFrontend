import { test } from './fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

test('checks can\'t access to activity', async ({ page, editPermissionsModal, itemPermissionsComponent }) => {
  await initAsUsualUser(page);
  await page.goto('a/5770807837681306905;p=6707691810849260111;a=0?watchedGroupId=672913018859223173');
  await itemPermissionsComponent.checksIsItemPermissionsSectionVisible();
  await editPermissionsModal.openPermissionsBlock();
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can view', 'Info');
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can grant view', 'Nothing');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can watch');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can edit');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Is Owner');
});

test('checks can view, watch and edit item permissions', async ({ page, editPermissionsModal, itemPermissionsComponent }) => {
  await initAsUsualUser(page);
  await page.goto('a/7443276868117946190;p=3792629363503902641;a=0?watchedGroupId=1546088973873922141');
  await itemPermissionsComponent.checksIsItemPermissionsSectionVisible();
  await editPermissionsModal.openPermissionsBlock();
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can view', 'Solution');
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can grant view', 'Solution');
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can watch', 'Answer');
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Can edit', 'All');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Is Owner');
});

test('checks is owner item permissions', async ({ page, editPermissionsModal, itemPermissionsComponent }) => {
  await initAsUsualUser(page);
  await page.goto('a/3792629363503902641;p=;a=0?watchedGroupId=1546088973873922141');
  await itemPermissionsComponent.checksIsItemPermissionsSectionVisible();
  await editPermissionsModal.openPermissionsBlock();
  await itemPermissionsComponent.checksIsPermissionRowWithValueVisible('Is Owner', 'Yes');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can view');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can grant view');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can watch');
  await itemPermissionsComponent.checksIsPermissionRowNotVisible('Can edit');
});
