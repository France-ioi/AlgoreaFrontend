import { test, expect } from './fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';

test('checks my group pages', async ({ page, minePage, manageGroupsPage }) => {
  await initAsUsualUser(page);
  await minePage.goto();
  const joinLinkBtnLocator = page.getByTestId('group-left-menu').getByRole('link', { name: 'Join' });
  const manageLinkBtnLocator = page.getByTestId('group-left-menu').getByRole('link', { name: 'Manage' });

  await test.step('checks join, manage buttons in left menu is visible', async () => {
    await expect.soft(joinLinkBtnLocator).toBeVisible();
    await expect.soft(manageLinkBtnLocator).toBeVisible();
  });

  await test.step('checks join page components is visible', async () => {
    await minePage.checkHeaderIsVisible();
    await minePage.checkHeaderSubtitleIsVisible();
    await minePage.checkJoinByCodeIsVisible();
    await minePage.checkIsPendingInvitationsVisible();
    await minePage.checkJoinedGroupsSectionIsVisible();
  });

  await test.step('checks manage page components is visible', async () => {
    await manageLinkBtnLocator.click();
    await manageGroupsPage.checkHeaderIsVisible();
    await manageGroupsPage.checkHeaderSubtitleIsVisible();
    await manageGroupsPage.checkManageGroupsSectionIsVisible();
  });
});

test('checks "Join" page as temp user', async ({ page, minePage }) => {
  await test.step('checks "Groups" tab in left menu as temp user', async () => {
    await minePage.goto();
    await expect.soft(page.getByRole('button', { name: 'Groups' })).toBeVisible();
  });

  await test.step('checks non auth message', async () => {
    await minePage.checkHeaderIsVisible();
    await minePage.checkHeaderSubtitleIsVisible();
    await minePage.checksNonAuthMessageIsVisible();
  });
});

test('checks "Manage" page as temp user', async ({ page, manageGroupsPage }) => {
  await test.step('checks "Groups" tab in left menu as temp user', async () => {
    await manageGroupsPage.goto();
    await expect.soft(page.getByRole('button', { name: 'Groups' })).toBeVisible();
  });

  await test.step('checks non auth message', async () => {
    await manageGroupsPage.checkHeaderIsVisible();
    await manageGroupsPage.checkHeaderSubtitleIsVisible();
    await manageGroupsPage.checksNonAuthMessageIsVisible();
  });
});


