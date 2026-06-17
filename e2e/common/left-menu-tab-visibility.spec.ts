import { test } from 'e2e/common/fixture';
import { mockConfig } from 'e2e/assets/mock-config';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';

const deepMerge = (o1: unknown, o2: unknown): unknown =>
  JSON.parse(JSON.stringify({ ...JSON.parse(JSON.stringify(o1)), ...JSON.parse(JSON.stringify(o2)) }));

const withoutSkillsTabConfig = () => ({
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'groups', showTo: 'all' },
    { type: 'search', showTo: 'all' },
  ],
});

const withoutGroupsTabConfig = () => ({
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'skills', showTo: 'all' },
    { type: 'search', showTo: 'all' },
  ],
});

const tabsForSpecificUsersConfig = (groupIds: string[]) => ({
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'skills', showTo: groupIds },
    { type: 'groups', showTo: groupIds },
    { type: 'search', showTo: 'all' },
  ],
});

const skillsForSpecificUsersConfig = (groupIds: string[]) => ({
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'skills', showTo: groupIds },
    { type: 'groups', showTo: 'all' },
    { type: 'search', showTo: 'all' },
  ],
});

const groupsForSpecificUsersConfig = (groupIds: string[]) => ({
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'skills', showTo: 'all' },
    { type: 'groups', showTo: groupIds },
    { type: 'search', showTo: 'all' },
  ],
});

const hiddenTabBarConfig = () => ({
  searchApiUrl: '',
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
  ],
});

test('checks the skills tab in the left menu is not shown', async ({ page, leftMenu }) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, withoutSkillsTabConfig())) }`,
    });
  });

  await page.goto('/a/home;pa=0');
  await leftMenu.checksIsLeftMenuVisible();
  await leftMenu.checksIsLeftNavTreeVisible();
  await leftMenu.checksIsTabVisible('Content');
  await leftMenu.checksIsTabNotVisible('Skills');
  await leftMenu.checksIsTabVisible('Groups');
});


test('checks the groups tab in the left menu is not shown', async ({ page, leftMenu }) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, withoutGroupsTabConfig())) }`,
    });
  });

  await page.goto('/a/home;pa=0');
  await leftMenu.checksIsLeftMenuVisible();
  await leftMenu.checksIsLeftNavTreeVisible();
  await leftMenu.checksIsTabVisible('Content');
  await leftMenu.checksIsTabVisible('Skills');
  await leftMenu.checksIsTabNotVisible('Groups');
});

test('checks the tab bar in the left menu is not shown', async ({ page, leftMenu }) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, hiddenTabBarConfig())) }`,
    });
  });

  await page.goto('/a/home;pa=0');
  await leftMenu.checksIsLeftMenuVisible();
  await leftMenu.checksIsLeftNavTreeVisible();
  await leftMenu.checksIsTabBarNotVisible();
});

test(
  'checks if visiting the user\'s personal page, the content of the menu is still items, not the group content of the left menu',
  async ({ page, leftMenu }
) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, hiddenTabBarConfig())) }`,
    });
  });
  await initAsTesterUser(page);
  await page.goto('/groups/users/4038740586962046790/personal-data');
  await leftMenu.checksIsLeftMenuVisible();
  await leftMenu.checksIsLeftNavTreeVisible();
  await leftMenu.checksIsTabBarNotVisible();
  await leftMenu.checksIsLeftNavTreeItemVisible('Parcours officiels');
  await leftMenu.checksIsLeftNavTreeItemVisible('Task #1 (via group: !634)');
});

test(
  'checks the tabs for specific users is shown',
  async ({ page, leftMenu }
) => {
  await page.route('*/**/assets/config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, tabsForSpecificUsersConfig([ '4038740586962046790' ]))) }`,
    });
  });

  await test.step('checks the tabs for specific user is shown', async () => {
    await initAsTesterUser(page);
    await page.goto('/a/home;pa=0');
    await leftMenu.checksIsLeftMenuVisible();
    await leftMenu.checksIsLeftNavTreeVisible();
    await leftMenu.checksIsTabVisible('Content');
    await leftMenu.checksIsTabVisible('Skills');
    await leftMenu.checksIsTabVisible('Groups');
  });

  await test.step('checks the tabs for other user is not shown', async () => {
    await initAsUsualUser(page);
    await page.goto('/a/home;pa=0');
    await leftMenu.checksIsLeftMenuVisible();
    await leftMenu.checksIsLeftNavTreeVisible();
    await leftMenu.checksIsTabVisible('Content');
    await leftMenu.checksIsTabNotVisible('Skills');
    await leftMenu.checksIsTabNotVisible('Groups');
    await leftMenu.checksIsTabVisible('Search');
  });
});

test(
  'checks skills tab for specific users is shown',
  async ({ page, leftMenu }
  ) => {
    await page.route('*/**/assets/config.js', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, skillsForSpecificUsersConfig([ '4038740586962046790' ]))) }`,
      });
    });

    await test.step('checks the skills tab for specific user is shown', async () => {
      await initAsTesterUser(page);
      await page.goto('/a/home;pa=0');
      await leftMenu.checksIsLeftMenuVisible();
      await leftMenu.checksIsLeftNavTreeVisible();
      await leftMenu.checksIsTabVisible('Content');
      await leftMenu.checksIsTabVisible('Skills');
      await leftMenu.checksIsTabVisible('Groups');
    });

    await test.step('checks the skills tab for other user is not shown', async () => {
      await initAsUsualUser(page);
      await page.goto('/a/home;pa=0');
      await leftMenu.checksIsLeftMenuVisible();
      await leftMenu.checksIsLeftNavTreeVisible();
      await leftMenu.checksIsTabVisible('Content');
      await leftMenu.checksIsTabNotVisible('Skills');
      await leftMenu.checksIsTabVisible('Groups');
    });
  });

test(
  'checks the groups tab for specific users is shown',
  async ({ page, leftMenu }
  ) => {
    await page.route('*/**/assets/config.js', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.appConfig=${ JSON.stringify(deepMerge(mockConfig, groupsForSpecificUsersConfig([ '4038740586962046790' ]))) }`,
      });
    });

    await test.step('checks the groups tab for specific user is shown', async () => {
      await initAsTesterUser(page);
      await page.goto('/a/home;pa=0');
      await leftMenu.checksIsLeftMenuVisible();
      await leftMenu.checksIsLeftNavTreeVisible();
      await leftMenu.checksIsTabVisible('Content');
      await leftMenu.checksIsTabVisible('Skills');
      await leftMenu.checksIsTabVisible('Groups');
    });

    await test.step('checks the groups tab for other user is not shown', async () => {
      await initAsUsualUser(page);
      await page.goto('/a/home;pa=0');
      await leftMenu.checksIsLeftMenuVisible();
      await leftMenu.checksIsLeftNavTreeVisible();
      await leftMenu.checksIsTabVisible('Content');
      await leftMenu.checksIsTabVisible('Skills');
      await leftMenu.checksIsTabNotVisible('Groups');
    });
  });
