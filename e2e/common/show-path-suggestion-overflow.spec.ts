import { expect, test } from 'e2e/common/fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const logsResponseJSON = [
  {
    'at': '2024-11-28T12:14:08Z',
    'activity_type': 'current_answer',
    'attempt_id': '0',
    'answer_id': '1667284660669705555',
    'from_answer_id': '1667284660669705555',
    'participant': {
      'id': '4038740586962046790',
      'name': 'e2e-tests',
      'type': 'User'
    },
    'user': {
      'id': '4038740586962046790',
      'login': 'e2e-tests',
      'first_name': null,
      'last_name': null
    },
    'item': {
      'id': '1357671178979168705',
      'type': 'Task',
      'string': {
        'title': 'Task with hidden progress'
      }
    },
    'can_watch_answer': true
  },
];

test('checks path suggestion for search result in left menu', async ({ page, showOverflow }) => {
  await initAsTesterUser(page);
  await page.goto('a/home;pa=0');

  await test.step('search for content', async () => {
    const leftMenuSearchLocator = page.locator('alg-left-menu-search');
    await expect.soft(leftMenuSearchLocator).toBeVisible();
    await leftMenuSearchLocator.getByRole('textbox').fill('Task');
    const leftMenuLoadingLocator = page.locator('alg-left-nav').locator('alg-loading');
    await expect.soft(leftMenuLoadingLocator).toBeVisible();
    await expect.soft(leftMenuLoadingLocator).not.toBeVisible();
  });

  await test.step('checks overflow is visible on hover', async () => {
    const firstSearchItemLocator = page.getByRole('link', { name: 'Task ask hint' });
    await expect.soft(firstSearchItemLocator).toBeVisible();
    await firstSearchItemLocator.hover();
    await showOverflow.checksIsOverflowVisible();
  });

  await test.step('checks overflow is hidden on hover out of overflow area', async () => {
    await showOverflow.hoverOut();
    await showOverflow.checksIsOverflowNotVisible();
  });
});

test('checks path suggestion in group logs', async ({ page, showOverflow }) => {
  await initAsTesterUser(page);

  await page.route(`${apiUrl}/items/log?limit=20&watched_group_id=4306830013673248439`, async route => {
    await route.fulfill({ json: logsResponseJSON });
  });

  await page.goto('/groups/by-id/4306830013673248439;p=614090468359597091/history');

  const firstRowLocator = page.locator('alg-group-log-view').locator('table').locator('tbody').locator('tr').first();
  const targetLinkLocator = firstRowLocator.locator('td').nth(1).locator('a');

  await test.step('checks logs are visible', async () => {
    await expect.soft(page.locator('alg-group-log-view').locator('table')).toBeVisible();
    await expect.soft(firstRowLocator).toBeVisible();
    await expect.soft(targetLinkLocator).toBeVisible();
  });

  await test.step('checks overflow is visible on hover', async () => {
    await targetLinkLocator.hover();
    await showOverflow.checksIsOverflowVisible();
  });

  await test.step('checks overflow is hidden on hover out of overflow area', async () => {
    await showOverflow.hoverOut();
    await showOverflow.checksIsOverflowNotVisible();
  });
});

test('checks path suggestion in item dependencies', async ({ page, showOverflow }) => {
  await initAsTesterUser(page);
  await page.goto('a/8827912206421200990;p=3244687538937221949;pa=0/dependencies');

  await test.step('checks overflow is visible on hover', async () => {
    const firstItemLocator = page.getByRole('link', { name: 'Task ask hint' });
    await expect.soft(firstItemLocator).toBeVisible();
    await firstItemLocator.hover();
    await showOverflow.checksIsOverflowVisible();
  });

  await test.step('checks overflow is hidden on hover out of overflow area', async () => {
    await showOverflow.hoverOut();
    await showOverflow.checksIsOverflowNotVisible();
  });
});

test('checks path suggestion in item unlock access', async ({ page, showOverflow }) => {
  await initAsTesterUser(page);
  await page.goto('/a/128139237432513103;p=4702,4102;pa=0');

  await test.step('checks overflow is visible on hover', async () => {
    const firstItemLocator = page.getByRole('link', { name: '4LA 1ère année UE Informatique' });
    await expect.soft(firstItemLocator).toBeVisible();
    await firstItemLocator.hover();
    await showOverflow.checksIsOverflowVisible();
  });

  await test.step('checks overflow is hidden on hover out of overflow area', async () => {
    await showOverflow.hoverOut();
    await showOverflow.checksIsOverflowNotVisible();
  });
});

test('checks path suggestion in add content', async ({ page, showOverflow, groupSettingsPage }) => {
  await initAsTesterUser(page);
  await groupSettingsPage.goto('/groups/by-id/4306830013673248439;p=614090468359597091/settings');

  await test.step('checks overflow is visible on hover', async () => {
    await groupSettingsPage.checksIsAssociatedActivitySectionVisible();
    const foundItemLocator = await groupSettingsPage.searchAssociatedActivity('Task with hidden progress');
    await foundItemLocator.getByText('Task with hidden progress').hover();
    await showOverflow.checksIsOverflowVisible();
  });

  await test.step('checks overflow is hidden on hover out of overflow area', async () => {
    await showOverflow.hoverOut();
    await showOverflow.checksIsOverflowNotVisible();
  });
});
