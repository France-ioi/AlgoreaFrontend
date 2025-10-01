import { test, expect } from '../common/fixture';
import { initAsTesterUser } from '../helpers/e2e_auth';
import { rootItemId } from 'e2e/items/create-item-fixture';
import { apiUrl } from 'e2e/helpers/e2e_http';

const testImageUrl = 'https://cdn.prod.website-files.com/66d16ac0a28e9fc29617fc2e/673b41ccea45ed2c55cf536b_angular-16-banner.jpg';
const secondTestImageUrl = 'https://www.ryadel.com/wp-content/uploads/2017/10/angular-logo.jpg';

const frItemResponse = {
  'type': 'Chapter',
  'display_details_in_parent': false,
  'validation_type': 'All',
  'requires_explicit_entry': false,
  'allows_multiple_attempts': false,
  'entry_participant_type': 'User',
  'duration': null,
  'no_score': false,
  'default_language_tag': 'en',
  'permissions': {
    'can_view': 'solution',
    'can_grant_view': 'solution_with_grant',
    'can_watch': 'answer_with_grant',
    'can_edit': 'all_with_grant',
    'is_owner': true,
    'can_request_help': true,
    'entering_time_intervals': []
  },
  'entry_min_admitted_members_ratio': 'None',
  'entry_frozen_teams': false,
  'entry_max_team_size': 0,
  'prompt_to_join_group_by_code': false,
  'title_bar_visible': true,
  'text_id': null,
  'read_only': false,
  'full_screen': 'default',
  'children_layout': 'List',
  'show_user_infos': false,
  'entering_time_min': '1000-01-01T00:00:00Z',
  'entering_time_max': '9999-12-31T23:59:59Z',
  'supported_language_tags': [
    'en',
    'fr'
  ],
  'best_score': 0,
  'string': {
    'language_tag': 'fr',
    'title': 'Title (fr)',
    'image_url': null,
    'subtitle': 'Subtitle (fr)',
    'description': 'Description (fr)',
    'edu_comment': null
  }
};

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test.afterEach(({ deleteItem }) => {});

test('checks edit parameters - image url', async ({ page, createItem, itemContentPage }, use) => {
  if (!createItem) throw new Error('The item is not created');
  const thumbnailUrlLocator = page.locator('div').filter({ hasText: /^Thumbnail url$/ });
  const imageUrlInputLocator = thumbnailUrlLocator.locator('input');

  await page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`);
  await expect.soft(page.getByRole('heading', { name: 'Display' })).toBeVisible();

  await test.step('Fill image url', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await imageUrlInputLocator.fill(testImageUrl);
  });

  await test.step('Save image url and check saved value', async () => {
    await itemContentPage.saveChangesAndCheckNotification();
    await expect.soft(imageUrlInputLocator).toHaveValue(testImageUrl);
  });

  await test.step('Switch lang to fr and check that the value still displayed', async () => {
    await page.route(`${apiUrl}/items/${ createItem.itemId }`, async route => {
      await route.fulfill({ json: { ...frItemResponse, id: createItem.itemId } });
    });

    await page.reload();
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toHaveValue(testImageUrl);
  });

  await test.step('Fill another image url on fr item as default', async () => {
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await imageUrlInputLocator.fill(secondTestImageUrl);
  });

  await test.step('Save image url and check saved value on en version', async () => {
    await itemContentPage.saveChangesAndCheckNotification();
    await page.unroute(`${apiUrl}/items/${ createItem.itemId }`);
    await page.goto(`a/${createItem.itemId};p=${rootItemId};pa=0/parameters`);
    await expect.soft(thumbnailUrlLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toBeVisible();
    await expect.soft(imageUrlInputLocator).toHaveValue(secondTestImageUrl);
  });

});
