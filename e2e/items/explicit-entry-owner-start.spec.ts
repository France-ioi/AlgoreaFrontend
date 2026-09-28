import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

test.use({ itemCreationType: 'Chapter with manual participation' });
test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {
  if (!deleteItem) throw new Error('Unexpected: missed deleted item data');
});

test('owner can start an explicit-entry chapter without meeting enter conditions', async ({
  page,
  createItem,
  itemContentPage,
}) => {
  if (!createItem) throw new Error('The item is not created');

  const contentUrl = `a/${createItem.itemId};p=${rootItemId};pa=0`;

  await test.step('open the newly created explicit-entry chapter', async () => {
    const itemResponsePromise = page.waitForResponse(response =>
      response.request().method() === 'GET' &&
      response.url().startsWith(`${apiUrl}/items/${createItem.itemId}`) &&
      !response.url().includes('/navigation') &&
      !response.url().includes('/children') &&
      !response.url().includes('/breadcrumbs') &&
      !response.url().includes('/attempts') &&
      response.ok()
    );
    await Promise.all([
      page.goto(contentUrl),
      itemResponsePromise,
      page.waitForResponse(`${apiUrl}/items/${createItem.itemId}/attempts?parent_attempt_id=0`),
    ]);
    const itemJson = await (await itemResponsePromise).json() as { requires_explicit_entry?: boolean };
    expect(itemJson.requires_explicit_entry).toBe(true);
    await itemContentPage.checksIsTitleVisible(createItem.itemName);
    await itemContentPage.checksOwnerManualEntryGateVisible();
    await expect(page.getByRole('button', { name: 'Enter now' })).not.toBeVisible();
  });

  await test.step('enable multiple attempts in parameters', async () => {
    await Promise.all([
      page.goto(`${contentUrl}/parameters`),
      itemContentPage.waitForItemResponse(createItem.itemId),
    ]);
    await expect(page.getByRole('heading', { name: 'Participation' })).toBeVisible();
    await itemContentPage.enableAllowMultipleAttemptsAndSave();
  });

  await test.step('content tab shows direct-start and disabled Enter now', async () => {
    await Promise.all([
      page.goto(contentUrl),
      itemContentPage.waitForItemResponse(createItem.itemId),
      page.waitForResponse(`${apiUrl}/items/${createItem.itemId}/attempts?parent_attempt_id=0`),
      page.waitForResponse(`${apiUrl}/items/${createItem.itemId}/entry-state`),
    ]);
    await itemContentPage.checksOwnerManualEntryGateVisible();
    await itemContentPage.checksRegularEnterNotAllowedVisible();
  });

  await test.step('start this activity then see Edit content switch', async () => {
    await Promise.all([
      itemContentPage.clickStartThisActivity(),
      page.waitForResponse(response =>
        response.request().method() === 'POST' &&
        /\/items\/[\d/]+\/attempts\?/.test(response.url()) &&
        response.ok()
      ),
    ]);
    await expect(page.getByTestId('edit-switch')).toBeVisible();
    await itemContentPage.checksIsSwitchEditVisible();
    await expect(itemContentPage.explicitEntryLocator).not.toBeVisible();
  });

  await test.step('request a new attempt from the attempts tab', async () => {
    await itemContentPage.openAttemptsTab();
    await expect(page.locator('alg-item-attempts')).toBeVisible();
    await page.getByRole('button', { name: 'Create a new attempt' }).click();
    // Explicit-entry create navigates to content with a=new.
    await expect(itemContentPage.explicitEntryLocator).toBeVisible();
    await itemContentPage.checksOwnerManualEntryGateVisible();
    // An attempt already exists, so the regular Enter block shows the already-started advice
    // (not the "not allowed" message from before the first start).
    await itemContentPage.checksAlreadyStartedAdviceVisible();
  });
});
