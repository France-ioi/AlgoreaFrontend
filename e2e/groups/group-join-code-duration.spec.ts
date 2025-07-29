import { test, expect } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteGroup }) => {
  if (!deleteGroup) throw new Error('Unexpected: missed deleted group data');
});

test('checks join by code duration saving', async ({ page, createGroup, duration, toast }) => {
  if (!createGroup) throw new Error('The group is not created');
  await page.goto(`/groups/by-id/${ createGroup?.groupId };p=/members`);
  await expect.soft(page.getByRole('heading', { name: createGroup.groupName })).toBeVisible();
  await expect.soft(page.getByRole('heading', { name: 'Let users join using a code' })).toBeVisible();
  const generateCodeBtnLocator = page.getByRole('button', { name: 'Generate a code ' });
  await expect.soft(generateCodeBtnLocator).toBeVisible();
  await generateCodeBtnLocator.click();
  const customBtnLocator = page.locator('alg-selection').getByText('Custom');
  await expect.soft(customBtnLocator).toBeVisible();
  await customBtnLocator.click();
  await expect.soft(page.locator('alg-duration')).toBeVisible();

  await test.step('fill duration and save', async () => {
    await duration.fillD('01');
    await duration.fillH('10');
    await duration.fillM('15');
    const saveBtnLocator = page.getByTestId('save-code-life-time-btn');
    expect.soft(saveBtnLocator).toBeVisible();
    await saveBtnLocator.click();
    await toast.checksIsMessageVisible('SuccessA new code has been');
  });

  await test.step('checks the duration displayed correct after save', async () => {
    await expect.soft(page.locator('alg-duration')).toBeVisible();
    await duration.checksIsDHasValue('1');
    await duration.checksIsHHasValue('10');
    await duration.checksIsMHasValue('15');
  });
});
