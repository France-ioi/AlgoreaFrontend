import { test, expect } from 'e2e/common/fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { Locator } from '@playwright/test';

// URL of the API call that populates the per-member rows of `alg-item-extra-time-for-descendants`.
// Used as an explicit `waitForResponse` target so the row visibility assertions have actual data
// to anchor on (otherwise on a slow CI runner the rows can take >5s to appear and eat into the
// 30s test budget — observed on CircleCI #55800 shard 2).
const membersAdditionalTimesUrl = `${apiUrl}/items/1480462971860767879/groups/672913018859223173/members/additional-times`;
const groupAdditionalTimesUrl = `${apiUrl}/items/1480462971860767879/groups/672913018859223173/additional-times`;

// Pick a numeric extra-time value that is guaranteed to differ from the current input value.
// The save button is rendered only when `value !== initialValue` (see
// `item-extra-time-input.component.html`). The dev backend persists state between test runs,
// so a hard-coded `Math.random() * 10` collides with the value left by an earlier test ~1/10
// of the time (especially the sibling `... for group` tests, which share the same field), and
// the save button never appears. Read the current value and avoid it.
async function pickDifferentExtraTimeValue(inputLocator: Locator): Promise<string> {
  const currentRaw = await inputLocator.inputValue();
  const currentNumber = Number.parseInt(currentRaw, 10);
  const current = Number.isFinite(currentNumber) ? currentNumber : 0;
  const candidate = Math.floor(Math.random() * 10) + 1;
  return String(candidate === current ? candidate + 1 : candidate);
}

test('checks update item extra time', { tag: '@no-parallelism' }, async ({ page, toast }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;a=0;og=672913018859223173/extra-time'),
    page.waitForResponse(membersAdditionalTimesUrl),
  ]);
  const targetRow = page.locator('alg-item-extra-time-for-descendants')
    .locator('table')
    .locator('tr')
    .filter({ has: page.getByText('usr_5p020x2thuyu') })
    .first();
  const inputLocator = targetRow.locator('alg-input-number').getByRole('textbox');
  const totalAdditionalTimeLocator = targetRow.getByTestId('total-additional-time');
  const currentTotalAdditionalTimeValue = await totalAdditionalTimeLocator.innerText();
  const saveBtnLocator = targetRow.getByTestId('item-extra-time-save-btn');
  const value = String(Math.floor(Math.random() * 10) + 1);

  await expect.soft(targetRow).toBeVisible();
  const currentInputValue = await inputLocator.inputValue();

  await test.step('save the new value', async () => {
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.dblclick();
    await page.keyboard.press('Backspace');
    await inputLocator.pressSequentially(`${value}`);
    await expect.soft(saveBtnLocator).toBeVisible();
    await saveBtnLocator.click();
    await expect.soft(saveBtnLocator).toBeDisabled();
    await page.waitForResponse(`${apiUrl}/items/1480462971860767879/groups/752024252804317630/additional-times?seconds=*`);
    await toast.checksIsMessageVisible('This participant\'s extra time has been successfully updated');
    await expect.soft(saveBtnLocator).not.toBeVisible();
  });

  await test.step('checks the participant-specific time and the total additional time has changed', async () => {
    await expect.soft(targetRow).toBeVisible();
    await expect.soft(inputLocator).toHaveValue(`${value}s`);
    await expect.soft(totalAdditionalTimeLocator)
      .toHaveText(`${ parseInt(value) - parseInt(currentInputValue) + parseInt(currentTotalAdditionalTimeValue) }s`);
  });
});

test('checks failure to update item extra time', async ({ page, toast }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;a=0;og=672913018859223173/extra-time'),
    page.waitForResponse(membersAdditionalTimesUrl),
  ]);
  const itemExtraTimeForDescendantsLocator = page.locator('alg-item-extra-time-for-descendants');
  const targetRow = itemExtraTimeForDescendantsLocator
    .locator('table')
    .locator('tr')
    .filter({ has: page.getByText('usr_5p020x2thuyu') })
    .first();
  await expect.soft(targetRow).toBeVisible();
  const inputLocator = targetRow.locator('alg-input-number').getByRole('textbox');
  await expect.soft(inputLocator).toBeVisible();
  await inputLocator.dblclick();
  await page.keyboard.press('Backspace');
  await inputLocator.pressSequentially(await pickDifferentExtraTimeValue(inputLocator));
  const saveBtnLocator = targetRow.getByTestId('item-extra-time-save-btn');
  await expect.soft(saveBtnLocator).toBeVisible();
  await page.route(`${apiUrl}/items/1480462971860767879/groups/752024252804317630/additional-times?seconds=*`, route =>
    route.abort('failed')
  );
  await saveBtnLocator.click();
  await toast.checksIsMessageVisible('The action cannot be executed. If the problem persists, contact us.');
  await expect.soft(saveBtnLocator).toBeVisible();
});

test('checks update item extra time for group', { tag: '@no-parallelism' }, async ({ page, toast }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;a=0;og=672913018859223173/extra-time'),
    page.waitForResponse(groupAdditionalTimesUrl),
  ]);
  const targetRow = page.getByTestId('extra-time-for-group');
  const inputLocator = targetRow.locator('alg-input-number').getByRole('textbox');
  const totalAdditionalTimeLocator = targetRow.getByTestId('total-additional-time');
  const saveBtnLocator = targetRow.getByTestId('item-extra-time-save-btn');
  const value = String(Math.floor(Math.random() * 10) + 1);
  await expect.soft(targetRow).toBeVisible();

  await test.step('save the new value', async () => {
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.dblclick();
    await page.keyboard.press('Backspace');
    await inputLocator.pressSequentially(`${value}`);
    await expect.soft(saveBtnLocator).toBeVisible();
    await saveBtnLocator.click();
    await expect.soft(saveBtnLocator).toBeDisabled();
    await page.waitForResponse(`${apiUrl}/items/1480462971860767879/groups/672913018859223173/additional-times?seconds=*`);
    await toast.checksIsMessageVisible('This group\'s extra time has been successfully updated');
    await expect.soft(saveBtnLocator).not.toBeVisible();
  });

  await test.step('checks the group total additional time has changed', async () => {
    await expect.soft(targetRow).toBeVisible();
    await expect.soft(inputLocator).toHaveValue(`${value}s`);
    await expect.soft(totalAdditionalTimeLocator).toHaveText(`${value}s`);
  });
});

test('checks failure to update item extra time for group', async ({ page, toast }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;a=0;og=672913018859223173/extra-time'),
    page.waitForResponse(groupAdditionalTimesUrl),
  ]);
  const targetRow = page.getByTestId('extra-time-for-group');
  await expect.soft(targetRow).toBeVisible();
  const inputLocator = targetRow.locator('alg-input-number').getByRole('textbox');
  await expect.soft(inputLocator).toBeVisible();
  await inputLocator.dblclick();
  await page.keyboard.press('Backspace');
  await inputLocator.pressSequentially(await pickDifferentExtraTimeValue(inputLocator));
  const saveBtnLocator = targetRow.getByTestId('item-extra-time-save-btn');
  await expect.soft(saveBtnLocator).toBeVisible();
  await page.route(`${apiUrl}/items/1480462971860767879/groups/672913018859223173/additional-times?seconds=*`, route =>
    route.abort('failed')
  );
  await saveBtnLocator.click();
  await toast.checksIsMessageVisible('The action cannot be executed. If the problem persists, contact us.');
  await expect.soft(saveBtnLocator).toBeVisible();
});
