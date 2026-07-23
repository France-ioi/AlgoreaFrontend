import { test, expect } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { HOURS } from 'src/app/utils/duration';
import { apiUrl } from 'e2e/helpers/e2e_http';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

const rootGroupId = '8248811194835349084';
const rootGroupName = 'E2E-generated-groups';

// GC may empty members + delete several leaked groups in one run.
test.setTimeout(120_000);

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
  const leftNavRootGroup = page.locator('cdk-nested-tree-node').filter({ has: page.getByText(rootGroupName) });
  await expect.soft(leftNavRootGroup).toBeVisible();
  const regExpGroup = /E2E_Group_\d{13}/;
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
    const leftNavGroupLocator = page.locator('cdk-nested-tree-node').getByText(groupName).first();
    await expect.soft(leftNavGroupLocator).toBeVisible();
    await leftNavGroupLocator.click();
    await expect(page).toHaveURL(/groups\/by-id\/\d+/);
    const groupIdMatch = page.url().match(/groups\/by-id\/(\d+)/);
    if (!groupIdMatch) throw new Error(`Unexpected: missed group id in URL after opening ${ groupName }`);
    const [ , groupId ] = groupIdMatch;

    // Delete stays disabled while User children remain (same as create-group-fixture teardown).
    await groupMembersPage.removeAllMembersIfAny(groupId);

    await Promise.all([
      groupSettingsPage.goto(`/groups/by-id/${ groupId };p=/settings`),
      groupSettingsPage.waitForGroupResponse(groupId),
    ]);
    await groupSettingsPage.checksIsDeleteButtonVisible();
    // Hard wait: soft-enabled check would still proceed to a hung click if disabled.
    await expect(groupSettingsPage.deleteGroupBtnLocator).toBeEnabled();
    await groupSettingsPage.deleteGroup();
    await groupSettingsPage.checksIsDeleteButtonDisabled();
    await Promise.all([
      toast.checksIsMessageVisible(`You have deleted "${ groupName }"`),
      page.waitForResponse(`${apiUrl}/groups/${rootGroupId}/navigation`),
    ]);
  }
});
