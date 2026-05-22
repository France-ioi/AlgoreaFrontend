import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks edit parameters - validation criteria', async ({ page, createItem, itemContentPage }, use) => {
  if (!createItem) throw new Error('The item is not created');
  // Set up the response listener BEFORE the navigation so we never miss the response: on a slow
  // runner, the heading assertion that follows can otherwise burn most of the test budget waiting
  // for data to arrive.
  await Promise.all([
    page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`),
    itemContentPage.waitForItemResponse(createItem.itemId),
  ]);
  // `<alg-item-edit-wrapper>` calls `itemForm.disable()` on first change-detection (in `ngOnChanges`)
  // and only re-enables it once `fetchOtherLanguages` resolves. While the form is disabled the
  // floating save button stays disabled even though the form is dirty, and on a slow CI runner the
  // pending `?language_tag=…` request can keep the form disabled longer than the test budget. Wait
  // for that secondary fetch (best-effort) so the form is guaranteed to be enabled before we
  // interact with it.
  await page.waitForResponse(response =>
    response.request().method() === 'GET'
    && new RegExp(`/items/${createItem.itemId}\\?[^/]*language_tag=`).test(response.url()),
  { timeout: 10_000 }).catch(() => undefined);
  await expect.soft(page.getByRole('heading', { name: 'Score & Validation' })).toBeVisible();
  const selectLocator = page.locator('alg-select').filter({ has: page.getByText('All children validated') });
  await expect.soft(selectLocator).toBeVisible();
  await selectLocator.click();
  const targetOptionLocator = page.locator('alg-select-option').getByText('Never');
  await expect.soft(targetOptionLocator).toBeVisible();
  await targetOptionLocator.click();
  await expect.soft(targetOptionLocator).not.toBeVisible();
  // Anchor on the post-change state (the trigger button now displays "Never") before saving so
  // that any remaining flake fails here, where the diagnostic is actionable, instead of inside
  // `saveChanges` polling on the disabled save button.
  await expect.soft(page.locator('alg-select').filter({ hasText: 'Never' })).toBeVisible();
  await itemContentPage.saveChangesAndCheckNotification();
  await expect.soft(page.locator('alg-select').getByText('Never')).toBeVisible();
});
