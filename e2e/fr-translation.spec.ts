import { test, expect } from './groups/fixture';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

// It runs "fr" version of app
test.use({ baseURL: 'http://localhost:4100' });

test('checks plural in left menu', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/home;pa=0');
  await expect.soft(page.getByText('(via le groupe: Pixal)')).toBeVisible();
});

test('checks plural for search in left menu', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/home;pa=0');
  const searchInputLocator = page.getByRole('textbox', { name: 'Recherche ?' });
  await expect.soft(searchInputLocator).toBeVisible();
  await searchInputLocator.click();
  await searchInputLocator.fill('Task');
  await expect.soft(page.getByText('10 premiers résultats')).toBeVisible();
});

test('checks plural in chapter user progress', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter');
  await expect.soft(page.getByText('1 (avec 2 indices)')).toBeVisible();
});

test('checks select in item log view', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('a/7528142386663912287;p=;a=0/progress/history');
  await expect.soft(page.getByRole('link', { name: 'Recharger la réponse' }).first()).toBeVisible();
});

test('checks select in item permissions', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/5770807837681306905;p=6707691810849260111;a=0?watchedGroupId=672913018859223173');
  const itemPermissionsLocator = page.locator('alg-item-permissions');
  await expect.soft(itemPermissionsLocator).toBeVisible();
  await expect.soft(
    page.getByText('«Pixal» ne peut pas accéder à cette activité')
  ).toBeVisible();
  await itemPermissionsLocator.click();
  await expect.soft(
    page.getByText('L(e) groupe peut voir cette activité mais ne pas peut pas lister son contenu.')
  ).toBeVisible();

  await page.goto('a/5280599138983174;p=;pa=0?watchedGroupId=672913018859223173');
  await expect.soft(page.getByText('Vous ne pouvez pas observer cette activité')).toBeVisible();

  await page.goto('a/5388967674530252881;p=6707691810849260111,5770807837681306905;a=0?watchedGroupId=672913018859223173');
  await expect.soft(itemPermissionsLocator).toBeVisible();
  await itemPermissionsLocator.click();
  await expect.soft(
    page.getByText('groupe ne peut actuellement pas voir ce contenu.')
  ).toBeVisible();
});

test('checks select in path suggestion ', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/298934231969021935;p=;a=0/dependencies');
  await expect.soft(page.getByText('Contenus qui dépendent de celui-ci')).toBeVisible();
  const linkLocator = page.getByRole('link', { name: 'TestTask' });
  await expect.soft(linkLocator).toBeVisible();
  await linkLocator.hover();
  await expect.soft(page.getByText('Ce contenu est l\'un de vos activité racines')).toBeVisible();
});

test('checks select in suggestion of activities', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('groups/by-id/2713577096475953687;p=');
  const toggleGroupObservationLocator = page.getByTestId('toggle-group-observation');
  await expect.soft(toggleGroupObservationLocator).toBeVisible();
  await toggleGroupObservationLocator.click();
  await expect.soft(page.getByText('Il n\'y a pas activité liée à ce(t) groupe.')).toBeVisible();
});

test('checks select in associated item', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('groups/by-id/3535308828390188167;p=/settings');

  await test.step('checks base captions', async () => {
    await expect.soft(page.getByText('Activité associée')).toBeVisible();
    await expect.soft(page.getByText('Il n\'y a actuellement pas de activités associée à ce groupe')).toBeVisible();
    await expect.soft(page.getByText('Compétence associée')).toBeVisible();
    await expect.soft(page.getByText('Il n\'y a actuellement pas de compétences associée à ce groupe.')).toBeVisible();
  });

  await test.step('checks error caption', async () => {
    await page.route(`${apiUrl}/items/6707691810849260111`, route => route.abort());
    await page.goto('groups/by-id/672913018859223173;p=52767158366271444/settings');
    await expect.soft(page.getByText('Erreur de chargement de la activité racine')).toBeVisible();
  });
});

test('checks select in member list', async ({ page, groupMembersPage }) => {
  await initAsUsualUser(page);
  await page.goto('/groups/by-id/4035378957038759250;p=/members');
  await groupMembersPage.goToTab('Sous-groupes');
  await expect.soft(page.getByRole('button', { name: 'Supprimer du groupe' })).toBeVisible();
});

test('checks select in item dependencies', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7528142386663912287;p=;a=0/dependencies');
  await expect.soft(page.getByText('Il n\'y a pas de pré-requis pour cette activité.')).toBeVisible();
});

test('checks select in user progress table', async ({ page }) => {
  await initAsTesterUser(page);
  await page.goto('/a/6379723280369399253;p=;pa=0/progress/chapter?watchedGroupId=123456');
  const selectionLocator = page.getByText('équipes');
  await expect.soft(selectionLocator).toBeVisible();
  await selectionLocator.click();
  await expect.soft(page.getByText('Ce groupe n\'a aucune équipe')).toBeVisible();
});

test('checks select for no content in left menu', async ({ page }) => {
  await page.goto('/groups/manage');
  await expect.soft(page.getByText('Vous n\'êtes membre ou gestionnaire d\'aucun groupe')).toBeVisible();
});

// To be translated
test('checks select for associated item can view info message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/1769157720761729219;p=7002637463896228384/settings?watchedGroupId=1769157720761729219');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item')).toBeVisible();
  await expect.soft(
    page.locator('alg-message-info').getByText('The activité is visible to the members of this group. They will see it in the left menu, in the "activité" tab.')
  ).toBeVisible();
});

test('checks select for associated item no access message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('groups/by-id/9024243890537335167;p=7002637463896228384/settings?watchedGroupId=9024243890537335167');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item')).toBeVisible();
  await expect.soft(
    page.locator('alg-message-info').getByText('This activité may not be visible to the members of this group. You can grant them access by "observing" the group')
  ).toBeVisible();
});

test('checks select for associated item with can\'t view and can\'t grant perm message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/9189508152532044730;p=7002637463896228384/settings?watchedGroupId=9189508152532044730');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item')).toBeVisible();
  await expect.soft(
    page.locator('alg-message-info').getByText('You are not allowed to give access to this group, ask another manager to do so.')
  ).toBeVisible();
});

test('checks select for associated item with current user can\'t grant and group can\'t view message', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/752055703863185594;p=7002637463896228384/settings?watchedGroupId=752055703863185594');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item')).toBeVisible();
  await expect.soft(page.locator('alg-message-info').getByText('This activité may not be visible to the members of this group. You are not allowed to grant access to this content, ask someone who has the permission to grant access to this content or make sure all your users can view the activité by other means (e.g. if it is public).')).toBeVisible();
});

test('checks select for associated item current user cannot grant permission to the group', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/3434783988769832015;p=7002637463896228384/settings?watchedGroupId=3434783988769832015');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item no perm')).toBeVisible();
  await expect.soft(
    page.locator('alg-message-info').getByText('You cannot view the permissions given to this group, so we cannot determine if it has access to this activité.')
  ).toBeVisible();
});

test('checks select for associated item current user either cannot watch or grant perm to the item', async ({ page, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/4113242269106225458;p=7002637463896228384/settings?watchedGroupId=4113242269106225458');
  const associatedItemLocator = page.locator('alg-associated-item').filter({ hasText: 'Activité associée' });
  await expect.soft(associatedItemLocator).toBeVisible();
  await expect.soft(associatedItemLocator.getByText('E2E: Associated Item no perm')).toBeVisible();
  await expect.soft(
    page.locator('alg-message-info').getByText('You cannot view the permissions given to this activité, so we cannot determine if the group has access to it.')
  ).toBeVisible();
});

