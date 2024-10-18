import { test, expect } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { HOURS } from 'src/app/utils/duration';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

const rootGroupId = '7035186126723551198';
const rootGroupName = 'E2E-generated-groups';

test('checks old e2e groups and remove it', { tag: '@no-parallelism' }, async ({
  page,
  groupMembersPage,
  groupSettingsPage,
  toast,
}) => {
  await initAsTesterUser(page);
  await Promise.all([
    page.goto(`groups/by-id/${rootGroupId};p=/members`),
    page.waitForResponse(`${apiUrl}/groups/${rootGroupId}/navigation`),
  ]);
  await groupMembersPage.checksIsHeaderVisible(rootGroupName);
  const leftNavRootGroup = page.locator('p-treenode').filter({ has: page.getByText(rootGroupName) });
  await expect.soft(leftNavRootGroup).toBeVisible();
  const regExpGroup = /E2E_\d{13}/;
  const leftNavFirstChild = leftNavRootGroup.getByText(regExpGroup).first();
  if (!(await leftNavFirstChild.isVisible())) return;

  const groupNamesForRemove = (await Promise.all((await leftNavRootGroup.getByText(regExpGroup).all())
    .map(item => item.textContent())))
    .filter(isNotNull)
    .filter(itemName => {
      const createdAtResult = itemName.match(/\d{13}/);
      if (!createdAtResult) throw new Error('Unexpected: Missed createdAtResult');
      const [ createdAt ] = createdAtResult;
      return Date.now() - Number(createdAt) > HOURS;
    });

  await leftNavFirstChild.click();

  for (const groupName of groupNamesForRemove) {
    const leftNavGroupLocator = page.locator('p-tree').getByText(groupName).first();
    await expect.soft(leftNavGroupLocator).toBeVisible();
    await leftNavGroupLocator.click();
    const settingsTabLocator = page.getByRole('link', { name: 'Settings' });
    await expect.soft(settingsTabLocator).toBeVisible();
    await settingsTabLocator.click();
    await groupSettingsPage.checksIsDeleteButtonVisible();
    await groupSettingsPage.checksIsDeleteButtonEnabled();
    await groupSettingsPage.deleteGroup();
    await groupSettingsPage.checksIsDeleteButtonDisabled();
    await Promise.all([
      toast.checksIsMessageVisible(`You have deleted "${ groupName }"`),
     page.waitForResponse(`${apiUrl}/groups/${rootGroupId}/navigation`),
    ]);
  }
});
