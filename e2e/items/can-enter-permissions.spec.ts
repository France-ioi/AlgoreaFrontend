import { test } from './fixture';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { convertDateToString } from 'src/app/utils/input-date';
import { farFutureDateString } from 'src/app/utils/date';
import { HOURS } from 'src/app/utils/duration';
import { expect } from 'e2e/groups/fixture';

test('check can enter permissions', { tag: '@no-parallelism' }, async ({ page, editPermissionsModal }) => {
  await initAsUsualUser(page);
  const fromDateValue = convertDateToString(new Date(Date.now() + HOURS));
  const untilDateValue = convertDateToString(new Date(Date.now() + (HOURS * 2)));

  await test.step('checks can enter permission is off', async () => {
    await initAsUsualUser(page);
    await page.goto('a/3668315727545144509;p=;pa=0?watchedGroupId=5751429939100258793');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/5751429939100258793/permissions/5751429939100258793/3668315727545144509');
    await editPermissionsModal.checksIsCanEnterSwitchFieldVisible();
    await editPermissionsModal.toggleCanEnterSwitchField();
    if (await editPermissionsModal.isFromUntilInputsVisible()) {
      await editPermissionsModal.toggleCanEnterSwitch();
      await editPermissionsModal.checksIsFromUntilInputsNotVisible();
      await editPermissionsModal.savePermissions();
      await editPermissionsModal.waitForPermissionsResponse('groups/5751429939100258793/permissions/5751429939100258793/3668315727545144509');
    }
  });

  await test.step('checks can enter control is visible', async () => {
    await page.goto('a/3668315727545144509;p=;pa=0?watchedGroupId=5751429939100258793');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/5751429939100258793/permissions/5751429939100258793/3668315727545144509');
  });

  await test.step('checks can enter control is visible', async () => {
    await editPermissionsModal.checksIsCanEnterSwitchFieldVisible();
    await editPermissionsModal.checksIsCanEnterValueInHeaderVisible('No');
    await editPermissionsModal.toggleCanEnterSwitchField();
    await editPermissionsModal.checksIsCanEnterSwitchVisible();
  });

  await test.step('checks can enter has base dates', async () => {
    await editPermissionsModal.toggleCanEnterSwitch();
    await editPermissionsModal.checksIsFromUntilInputsVisible();
    await editPermissionsModal.checksIsFromDateValueVisible(convertDateToString(new Date()));
    await editPermissionsModal.checksIsUntilDateValueVisible(convertDateToString(new Date(farFutureDateString)));
  });

  await test.step('checks fill can enter and save', async () => {
    await editPermissionsModal.fillFromValue(fromDateValue);
    await editPermissionsModal.fillUntilValue(untilDateValue);
    await editPermissionsModal.toggleCanEnterSwitchField();
    await editPermissionsModal.checksIsCanEnterValueInHeaderVisible(`${fromDateValue} - ${untilDateValue}`);
    await editPermissionsModal.savePermissions();
    await editPermissionsModal.waitForPermissionsResponse('groups/5751429939100258793/permissions/5751429939100258793/3668315727545144509');
    await editPermissionsModal.checksIsPermissionsModalNotVisible();
  });

  await test.step('checks can enter switch is enable', async () => {
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/5751429939100258793/permissions/5751429939100258793/3668315727545144509');
    await editPermissionsModal.toggleCanEnterSwitchField();
    await editPermissionsModal.checksIsFromUntilInputsVisible();
  });

  await test.step('checks can enter value after save', async () => {
    await editPermissionsModal.checksIsFromDateValueVisible(fromDateValue);
    await editPermissionsModal.checksIsUntilDateValueVisible(untilDateValue);
  });

  await test.step('checks turn off can enter switch and save', async () => {
    await editPermissionsModal.toggleCanEnterSwitch();
    await editPermissionsModal.checksIsFromUntilInputsNotVisible();
    await editPermissionsModal.savePermissions();
  });
});

test('check can enter fields behaviour', async ({ page, editPermissionsModal }) => {
  await initAsUsualUser(page);
  const fromDateValue = convertDateToString(new Date(Date.now() + (HOURS * 2)));
  const untilDateValue = convertDateToString(new Date(Date.now() + (HOURS * 3)));

  await test.step('checks can enter control is visible', async () => {
    await page.goto('a/6379723280369399253;p=7523720120450464843;pa=0?watchedGroupId=123456');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/123456/permissions/123456/6379723280369399253');
  });

  await test.step('checks can enter control is visible', async () => {
    await editPermissionsModal.checksIsCanEnterSwitchFieldVisible();
    await editPermissionsModal.toggleCanEnterSwitchField();
  });

  await test.step('checks can enter from focus out', async () => {
    await editPermissionsModal.toggleCanEnterSwitch();
    await editPermissionsModal.checksIsFromUntilInputsVisible();
    await editPermissionsModal.fillFromValue(fromDateValue);
    await editPermissionsModal.fillUntilValue(untilDateValue);
    await editPermissionsModal.checksIsFromDateValueVisible(fromDateValue);
    await editPermissionsModal.checksIsUntilDateValueVisible(untilDateValue);
    await editPermissionsModal.fillFromValue('');
    await editPermissionsModal.fillUntilValue('');
    await editPermissionsModal.checksIsFromDateValueVisible(convertDateToString(new Date()));
    await editPermissionsModal.blurUntilInput();
    await editPermissionsModal.checksIsUntilDateValueVisible(convertDateToString(new Date(farFutureDateString)));
  });

  await test.step('checks can enter until validation', async () => {
    await editPermissionsModal.fillFromValue(fromDateValue);
    await editPermissionsModal.fillUntilValue(fromDateValue);
    await editPermissionsModal.checksIsUntilValidationMessageVisible(fromDateValue);
    await editPermissionsModal.isSavePermissionsBtnDisabled();
    await editPermissionsModal.fillUntilValue(untilDateValue);
    await editPermissionsModal.checksIsUntilValidationMessageNotVisible(fromDateValue);
    await editPermissionsModal.isSavePermissionsBtnEnabled();
  });

  await test.step('checks can enter sub controls validation', async () => {
    await editPermissionsModal.fillFromValue('32/09/2024 22:34');
    await expect.soft(page.getByText('Invalid date')).toBeVisible();
    await editPermissionsModal.fillUntilValue('32/09/2024 22:34');
    await editPermissionsModal.isSavePermissionsBtnDisabled();
    await editPermissionsModal.fillFromValue(fromDateValue);
    await editPermissionsModal.fillUntilValue(untilDateValue);
    await expect.soft(page.getByText('Invalid date')).not.toBeVisible();
    await editPermissionsModal.isSavePermissionsBtnEnabled();
    await editPermissionsModal.fillFromValue('32/09/2024 22:34');
    await expect.soft(page.getByText('Invalid date')).toBeVisible();
    await editPermissionsModal.isSavePermissionsBtnDisabled();
    await editPermissionsModal.toggleCanEnterSwitch();
    await editPermissionsModal.isSavePermissionsBtnEnabled();
  });
});

test('check can enter warning', async ({ page, editPermissionsModal }) => {
  await initAsUsualUser(page);
  await test.step('checks can enter control is visible', async () => {
    await page.goto('a/899800937596940136;p=694914435881177216,5,4700,4707,4702,4102;pa=0?watchedGroupId=917454091139548680');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/917454091139548680/permissions/917454091139548680/899800937596940136');
  });

  await test.step('checks can enter warning for form value', async () => {
    await editPermissionsModal.checksIsCanEnterSwitchFieldVisible();
    await editPermissionsModal.openField('Can view');
    await editPermissionsModal.selectOption('Can view', 'Content');
    await editPermissionsModal.checksIsCanEnterWarningVisible();
    await editPermissionsModal.selectOption('Can view', 'Info');
    await editPermissionsModal.checksIsCanEnterWarningNotVisible();
  });

  await test.step('checks can enter warning for grand view', async () => {
    await page.goto('a/1980584647557587953;p=;pa=0?watchedGroupId=917454091139548680');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/917454091139548680/permissions/917454091139548680/1980584647557587953');
    await editPermissionsModal.checksIsCanEnterSwitchFieldVisible();
    await editPermissionsModal.checksIsCanEnterWarningVisible();
  });
});

test('checks item with no explicit entry',async ({ page, editPermissionsModal }) => {
  await initAsUsualUser(page);
  await test.step('checks can enter control is not visible', async () => {
    await page.goto('a/2268458803184278714;p=;pa=0?watchedGroupId=123456');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.waitForPermissionsResponse('groups/123456/permissions/123456/2268458803184278714');
    await editPermissionsModal.checksIsCanEnterSwitchFieldNotVisible();
  });
});
