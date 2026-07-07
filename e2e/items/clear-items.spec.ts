import { test } from 'e2e/common/fixture';
import { expect } from 'e2e/items/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { HOURS } from 'src/app/utils/duration';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

const rootItemId = '1751831682141956756';
const rootItemName = 'E2E-generated-items';
// Avoid a growing backlog from failed runs blowing the test budget on a single CI attempt.
const maxDeletionsPerRun = 5;

test('checks old e2e items and remove it', { tag: '@no-parallelism' }, async ({ page, itemContentPage }) => {
  test.slow();
  await initAsTesterUser(page);
  await Promise.all([
    itemContentPage.goto(`a/${rootItemId};a=0`),
    itemContentPage.waitForItemResponse(rootItemId),
    itemContentPage.waitForNavigationResponse(rootItemId),
  ]);
  await expect(page.getByTestId('item-title')).toHaveText(rootItemName);
  const leftNavRootItem = page.locator('cdk-nested-tree-node').filter({ has: page.getByText(rootItemName) });
  const regExpItem = /E2E_Item_\d{13}/;

  const itemNamesForRemove = (await Promise.all((await leftNavRootItem.getByText(regExpItem).all())
    .map(item => item.textContent())))
    .filter(isNotNull)
    .filter(itemName => {
      const createdAtResult = itemName.match(/\d{13}/);
      if (!createdAtResult) throw new Error('Unexpected: Missed createdAtResult');
      const [ createdAt ] = createdAtResult;
      return Date.now() - Number(createdAt) > HOURS;
    })
    .slice(0, maxDeletionsPerRun);

  for (const itemName of itemNamesForRemove) {
    const trimmedName = itemName.trim();
    // Root chapter keeps the full tree expanded (nav CASE 4): no back button, only nested selection.
    await itemContentPage.clickNavItemAndWaitForTitle(trimmedName);
    await itemContentPage.openParametersTab();
    await itemContentPage.checksIsDeleteButtonVisible();
    await itemContentPage.waitForDeleteButtonReady();
    if (!(await itemContentPage.isDeleteButtonEnabled())) {
      continue;
    }
    await itemContentPage.deleteItem();
    await itemContentPage.checkToastNotification(`You have delete "${trimmedName}"`);
    await Promise.all([
      expect(page.getByTestId('item-title')).toHaveText(rootItemName),
      itemContentPage.waitForNavigationResponse(rootItemId),
    ]);
  }
});
