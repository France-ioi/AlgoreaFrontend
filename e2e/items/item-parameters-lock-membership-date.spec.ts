import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks lock membership date saving', async ({ page, createItem, itemContentPage, duration }) => {
  if (!createItem) throw new Error('The item is not created');
  // The previous shape (`await Promise.all([await goto(...), await waitForItemResponse(...)])`)
  // serialized the two awaits before constructing the array, so the response listener was only
  // attached AFTER navigation completed — defeating the point of `Promise.all`. Spawn both
  // promises concurrently instead, so the listener is wired up before the response can land.
  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);

  await expect.soft(page.getByRole('heading', { name: 'Participation' })).toBeVisible();

  const switchTargetLocator = page.getByTestId('form-item-view')
    .filter({ hasText: /^Start participation manually$/ })
    .locator('alg-switch');
  await expect.soft(switchTargetLocator).toBeVisible();
  await switchTargetLocator.click();

  const switch2TargetLocator = page.getByTestId('form-item-view')
    .filter({ hasText: 'Duration' })
    .locator('alg-switch');
  await expect.soft(switch2TargetLocator).toBeVisible();
  await switch2TargetLocator.click();

  await test.step('fill duration and save', async () => {
    const durationLocator = page.locator('alg-duration');
    await expect.soft(durationLocator).toBeVisible();
    await duration.fillH('01');
    await duration.fillM('10');
    await duration.fillS('15');
    await itemContentPage.saveChangesAndCheckNotification();
  });

  await test.step('checks the duration displayed correct after save', async () => {
    await expect.soft(switchTargetLocator).toBeVisible();
    await duration.checksIsHHasValue('1');
    await duration.checksIsMHasValue('10');
    await duration.checksIsSHasValue('15');
  });
});
