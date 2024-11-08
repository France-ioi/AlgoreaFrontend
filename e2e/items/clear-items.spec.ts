import { test } from 'e2e/common/fixture';
import { expect } from 'e2e/items/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { HOURS } from 'src/app/utils/duration';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

const rootItemId = '4710077428991025828';
const rootItemName = 'E2E-generated-items';

test('checks old e2e items and remove it', { tag: '@no-parallelism' }, async ({ page, itemContentPage }) => {
  await initAsTesterUser(page);
  await Promise.all([
    itemContentPage.goto(`a/${rootItemId};a=0`),
    itemContentPage.waitForItemResponse(rootItemId),
    page.waitForResponse(`${apiUrl}/items/${rootItemId}/navigation?attempt_id=0`)
  ]);
  await itemContentPage.checksIsTitleVisible(rootItemName);
  const leftNavRootItem = page.locator('p-treenode').filter({ has: page.getByText(rootItemName) });
  const regExpItem = /E2E_\d{13}/;

  const itemNamesForRemove = (await Promise.all((await leftNavRootItem.getByText(regExpItem).all())
    .map(item => item.textContent())))
    .filter(isNotNull)
    .filter(itemName => {
      const createdAtResult = itemName.match(/\d{13}/);
      if (!createdAtResult) throw new Error('Unexpected: Missed createdAtResult');
      const [ createdAt ] = createdAtResult;
      return Date.now() - Number(createdAt) > HOURS;
    });

  for (const itemName of itemNamesForRemove) {
    const targetItemLocator = page.locator('p-tree').getByText(itemName.trim()).first();
    await expect.soft(targetItemLocator).toBeVisible();
    await targetItemLocator.click();
    await expect.soft(page.locator('alg-left-menu-back-button').getByText(rootItemName)).toBeVisible();
    const parametersTabLocator = page.getByRole('link', { name: 'Parameters' });
    await expect.soft(parametersTabLocator).toBeVisible();
    await parametersTabLocator.click();
    await itemContentPage.checksIsDeleteButtonVisible();
    await itemContentPage.deleteItem();
    await itemContentPage.checkToastNotification(`You have delete "${itemName.trim()}"`);
    await itemContentPage.checksIsTitleVisible(rootItemName);
  }
});
