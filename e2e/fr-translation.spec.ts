import { test, expect } from './groups/fixture';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';

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
    page.getByText('«Pixal» ne peut peut-être pas accéder à cette activité')
  ).toBeVisible();
  await itemPermissionsLocator.click();
  await expect.soft(
    page.getByText(
      "Ce groupe peut voir le titre, sous-titre et la description de cette activité mais ne peut peut-être pas voir ce qu'elle contient."
    )
  ).toBeVisible();

  await page.goto('a/5280599138983174;p=;pa=0?watchedGroupId=672913018859223173');
  await expect.soft(page.getByText("Vous ne pouvez pas observer les progrès d'autres utilisateurs sur cette activité")).toBeVisible();

  await page.goto('a/5388967674530252881;p=6707691810849260111,5770807837681306905;a=0?watchedGroupId=672913018859223173');
  await expect.soft(itemPermissionsLocator).toBeVisible();
  await itemPermissionsLocator.click();
  await expect.soft(
    page.getByText("Ce groupe n'a reçu aucun droit direct pour voir ce contenu. ")
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
