import { test } from './fixture';
import { initAsDemoUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const chapterResponse = {
  'id': '4702',
  'type': 'Chapter',
  'display_details_in_parent': false,
  'validation_type': 'All',
  'requires_explicit_entry': true,
  'allows_multiple_attempts': false,
  'entry_participant_type': 'User',
  'duration': null,
  'no_score': false,
  'default_language_tag': 'fr',
  'permissions': {
    'can_view': 'content',
    'can_grant_view': 'none',
    'can_watch': 'none',
    'can_edit': 'none',
    'is_owner': false,
    'can_request_help': false
  },
  'entry_min_admitted_members_ratio': 'None',
  'entry_frozen_teams': true,
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
    'fr'
  ],
  'best_score': 8.13343,
  'string': {
    'language_tag': 'fr',
    'title': 'Parcours officiels (Mocked)',
    'image_url': null,
    'subtitle': null,
    'description': null
  }
};

const taskResponse = {
  'id': '6379723280369399253',
  'type': 'Task',
  'display_details_in_parent': false,
  'validation_type': 'All',
  'requires_explicit_entry': false,
  'allows_multiple_attempts': true,
  'entry_participant_type': 'User',
  'duration': null,
  'no_score': false,
  'default_language_tag': 'en',
  'permissions': {
    'can_view': 'content',
    'can_grant_view': 'none',
    'can_watch': 'none',
    'can_edit': 'none',
    'is_owner': true,
    'can_request_help': true
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
    'en'
  ],
  'best_score': 50,
  'string': {
    'language_tag': 'en',
    'title': 'Blockly Basic Task',
    'image_url': 'https://angular.io/assets/images/logos/angular/logo-nav@2x.png',
    'subtitle': '32131c',
    'description': null,
    'edu_comment': null
  },
  'url': 'https://static-items.algorea.org/files/checkouts/d3fa874bb54a405bd268ee10f773974d/programmation/SNT_turtle_boucles_01/index.html',
  'options': '',
  'uses_api': true,
  'hints_allowed': false
};

const skillResponse = {
  'id': '568547986401741399',
  'type': 'Skill',
  'display_details_in_parent': false,
  'validation_type': 'All',
  'requires_explicit_entry': false,
  'allows_multiple_attempts': false,
  'entry_participant_type': 'User',
  'duration': null,
  'no_score': false,
  'default_language_tag': 'en',
  'permissions': {
    'can_view': 'none',
    'can_grant_view': 'none',
    'can_watch': 'none',
    'can_edit': 'none',
    'is_owner': true,
    'can_request_help': true
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
    'en'
  ],
  'best_score': 0,
  'string': {
    'language_tag': 'en',
    'title': 'Skill only for demouser',
    'image_url': null,
    'subtitle': null,
    'description': null,
    'edu_comment': null
  },
  'url': null,
  'options': null,
  'uses_api': true,
  'hints_allowed': false
};

const attemptsResponse = [
  {
    'id': '0',
    'created_at': '2017-09-14T10:59:38Z',
    'score_computed': 50,
    'validated': false,
    'started_at': '2021-12-01T09:41:13Z',
    'ended_at': null,
    'allows_submissions_until': '9999-12-31T23:59:59Z',
    'latest_activity_at': '2024-08-20T14:40:37Z',
    'help_requested': false,
    'user_creator': {
      'login': 'usr_5p020x2thuyu',
      'first_name': null,
      'last_name': null,
      'group_id': '752024252804317630'
    }
  }
];

test('checks item description', async ({ page, itemContentPage }) => {
  await initAsUsualUser(page);

  // Task with description: description should not be shown
  await test.step('checks description is not visible for "Task"', async () => {
    await Promise.all([
      itemContentPage.goto('/a/6379723280369399253;p=;a=0'),
      itemContentPage.waitForItemResponse('6379723280369399253'),
      itemContentPage.waitForBreadcrumbsResponse('6379723280369399253'),
    ]);
    await itemContentPage.checksIsDescriptionSectionNotVisible();
  });

  // Chapter with description: description should be shown
  await test.step('checks description is visible for "Chapter"', async () => {
    await Promise.all([
      itemContentPage.goto('/a/7523720120450464843;p=;a=0'),
      itemContentPage.waitForItemResponse('7523720120450464843'),
      itemContentPage.waitForBreadcrumbsResponse('7523720120450464843'),
    ]);
    await itemContentPage.checksIsDescriptionVisible('Some description');
  });

  // Skill with description: description should be shown
  await test.step('checks description is visible for "Skill"', async () => {
    await initAsUsualUser(page);
    await Promise.all([
      itemContentPage.goto('/s/8865540088611165367;p=;a=0'),
      itemContentPage.waitForItemResponse('8865540088611165367'),
      itemContentPage.waitForBreadcrumbsResponse('8865540088611165367'),
    ]);
    await itemContentPage.checksIsDescriptionVisible('Some description');
  });
});

// Chapter, with no view content perm, not explicit entry item, no prerequisite, temp user: login wall shown
test('checks chapter no access message with no prerequisites section', async ({ itemContentPage }) => {
  await Promise.all([
    itemContentPage.goto('a/902356740789159624;p=4702,4102;pa=0'),
    itemContentPage.waitForItemResponse('902356740789159624'),
    itemContentPage.waitForBreadcrumbsResponse('4702/4102/902356740789159624', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksIsLoginWallVisible();
});

// Chapter, with no view content perm, not explicit entry item, with prerequisite: chapter specific message, with prerequisite part
test('checks chapter no access message with prerequisites section', async ({ itemContentPage }) => {
  await Promise.all([
    itemContentPage.goto('a/128139237432513103;p=4702,4102;pa=0'),
    itemContentPage.waitForItemResponse('128139237432513103'),
    itemContentPage.waitForBreadcrumbsResponse('4702/4102/128139237432513103', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksIsChapterLockedMessageVisible();
  await itemContentPage.checksIsPrerequisiteSectionVisible();
});

// Chapter, with view content perm, no edit perm, not explicit entry, : load/show children (or empty)
test('checks chapter children list is visible with view content perm no edit perm not explicit entry', async ({ itemContentPage, page }) => {
  await initAsUsualUser(page);
  await Promise.all([
    itemContentPage.goto('a/home;a=0'),
    itemContentPage.waitForItemResponse('4702'),
    itemContentPage.waitForBreadcrumbsResponse('4702'),
    itemContentPage.waitForChildrenResponse('4702'),
  ]);
  await itemContentPage.checksIsChapterChildrenSectionVisible();
  await itemContentPage.checksIsChapterChildVisible('Parcours officiels');
});

// Chapter, with view content perm, no edit perm, explicit entry but 1 result available
// (mock service for that): load/show children (or empty)
test('checks chapter children list is visible with view content perm, no edit perm, explicit entry but 1 result available', async ({ itemContentPage, page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/4702`, async route => {
    await route.fulfill({ json: chapterResponse });
  });
  await itemContentPage.goto('a/home;a=0');
  await itemContentPage.checksIsChapterChildrenSectionVisible();
  await itemContentPage.checksIsChapterChildVisible('Parcours officiels');
});

// Chapter, with view content perm, edit children perm, not explicit entry:
// children edition switch shown, no skill sub/parent shown
test('checks chapter children edition switch is visible, sub/parent skills is not visible with view content', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/6707691810849260111;p=;a=0'),
    itemContentPage.waitForItemResponse('6707691810849260111'),
    itemContentPage.waitForBreadcrumbsResponse('6707691810849260111'),
    itemContentPage.waitForChildrenResponse('6707691810849260111'),
  ]);
  await itemContentPage.checksIsChapterChildrenSectionVisible();
  await itemContentPage.checksIsSwitchEditVisible();
  await itemContentPage.checksIsSubParentSkillsSectionNotVisible();
});

// Chapter, with view content perm, edit children perm, not explicit entry, on children-edit url: children edition switch shown,
// children edition comp shown, no skill sub/parent shown
test('checks chapter edit mode: children edition switch is visible, children edition view is visible, sub/parent skills is not visible', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/6707691810849260111;p=;a=0/edit-children'),
    itemContentPage.waitForItemResponse('6707691810849260111'),
    itemContentPage.waitForBreadcrumbsResponse('6707691810849260111'),
    itemContentPage.waitForChildrenResponse('6707691810849260111', 'attempt_id=0&show_invisible_items=1'),
  ]);
  await itemContentPage.checksIsSwitchEditVisible();
  await itemContentPage.checksIsChapterChildrenSectionNotVisible();
  await itemContentPage.checksIsItemChildrenEditListVisible();
  await itemContentPage.checksIsSubParentSkillsSectionNotVisible();
});

// Chapter, with view content perm, no edit perm, not explicit entry, on children-edit url: children edition switch shown,
// children edition comp shown with message, no skill sub/parent shown
test('checks chapter edit mode: children edition switch is visible children no edit message is not visible, sub/parent skills is visible', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/home;a=0/edit-children'),
    itemContentPage.waitForItemResponse('4702'),
    itemContentPage.waitForBreadcrumbsResponse('4702'),
  ]);
  await itemContentPage.checksIsSwitchEditVisible();
  await itemContentPage.checksIsChapterChildrenSectionNotVisible();
  await itemContentPage.checksIsItemChildrenEditListNotVisible();
  await itemContentPage.checksIsSubParentSkillsSectionNotVisible();
  await itemContentPage.checksNoEditPermissionMessageIsVisible();
});

// Skill, with view content perm, edit children perm, not explicit entry:
// children edition switch shown, sub skills sub shown, skill parent shown
test('checks skill children edition switch is visible, sub/parent skills is visible with view content perm, edit children perm, not explicit entry', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('s/568547986401741399;p=;a=0'),
    itemContentPage.waitForItemResponse('568547986401741399'),
    itemContentPage.waitForBreadcrumbsResponse('568547986401741399'),
  ]);
  await itemContentPage.checksIsSwitchEditVisible();
  await itemContentPage.checksIsSubParentSkillsSectionVisible();
});

// Skill, with view content perm, edit children perm, not explicit entry, on children-edit url:
// children edition switch shown, children edition comp shown, sub skills comp NOT shown, skill parent shown
test('checks skill on children-edit url: children edition switch is visible, children edition is visible, sub skills is not visible, parent skills is visible with view content perm, edit children perm, not explicit entry', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('s/568547986401741399;p=;a=0/edit-children'),
    itemContentPage.waitForItemResponse('568547986401741399'),
    itemContentPage.waitForBreadcrumbsResponse('568547986401741399'),
  ]);
  await itemContentPage.checksIsSwitchEditVisible();
  await itemContentPage.checksIsItemChildrenEditFormVisible();
  await itemContentPage.checksIsSubSkillsSectionNotVisible();
  await itemContentPage.checksIsParentSkillsSectionVisible();
});

// Skill, with no view content perm, not explicit entry item: skill specific message
test('checks skill no access message', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await page.route(`${apiUrl}/items/568547986401741399`, async route => {
    await route.fulfill({ json: skillResponse });
  });
  await Promise.all([
    itemContentPage.goto('s/568547986401741399;p=;a=0'),
    itemContentPage.waitForBreadcrumbsResponse('568547986401741399'),
  ]);
  await itemContentPage.checksSkillNoAccessMessageIsVisible();
});

// Task with view content perm, explicit entry, non empty url, a current result available:
// item-display in dom with opacity 0, "Loading the content" shown
test('checks task loading the content message with view content perm, explicit entry, non empty url, a current result available', async ({ itemContentPage, page }) => {
  await initAsUsualUser(page);
  await Promise.all([
    itemContentPage.goto('a/8762331199149369455;p=694914435881177216,5,4700,4707,4702,7528142386663912287,944619266928306927;a=0'),
    itemContentPage.waitForItemResponse('8762331199149369455'),
    itemContentPage.waitForBreadcrumbsResponse('694914435881177216/5/4700/4707/4702/7528142386663912287/944619266928306927/8762331199149369455'),
  ]);
  await Promise.all([
    itemContentPage.checksLoadingContentMessageIsVisible(),
    itemContentPage.checksItemDisplayHasZeroOpacity(),
  ]);
});

// Task with view content perm, no edit perm, not explicit entry, empty url: error message
test('checks task empty url message', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/1501663083087440078;p=7528142386663912287,3327328786400474746;a=0'),
    itemContentPage.waitForItemResponse('1501663083087440078'),
    itemContentPage.waitForBreadcrumbsResponse('7528142386663912287/3327328786400474746/1501663083087440078'),
  ]);
  await itemContentPage.checksTaskNotCorrectlyConfiguredMessageIsVisible();
});

// Task with view content perm, edit perm, not explicit entry, empty url: other error message
test('checks task empty url message with can edit perm', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/878263964159393890;p=7528142386663912287,7523720120450464843;pa=0'),
    itemContentPage.waitForItemResponse('878263964159393890'),
    itemContentPage.waitForBreadcrumbsResponse('7528142386663912287/7523720120450464843/878263964159393890', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksTaskNotCorrectlyConfiguredMessageIsVisible();
  await itemContentPage.checksTaskSetUrlMessageIsVisible();
});

// Task with view content perm, not explicit entry, non empty url: item-display in dom with opacity 0, "Loading the content" shown
test('checks task loading the content message with view content perm, not explicit entry, non empty url', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/8760146602351467826;p=7528142386663912287,7523720120450464843;a=0'),
    itemContentPage.waitForItemResponse('8760146602351467826'),
    itemContentPage.waitForBreadcrumbsResponse('7528142386663912287/7523720120450464843/8760146602351467826'),
  ]);
  await Promise.all([
    itemContentPage.checksLoadingContentMessageIsVisible(),
    itemContentPage.checksItemDisplayHasZeroOpacity(),
  ]);
});

// Task, with no view content perm, not explicit entry item: task specific message
test('checks task no access message with no view content perm, not explicit entry', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await Promise.all([
    itemContentPage.goto('a/6747343693587333585;p=4702,7528142386663912287,944619266928306927;pa=0'),
    itemContentPage.waitForItemResponse('6747343693587333585'),
    itemContentPage.waitForBreadcrumbsResponse('4702/7528142386663912287/944619266928306927/6747343693587333585', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksTaskNoAccessMessageIsVisible();
});

// Task, with view content perm, explicit entry, results not fetched yet (mock the service for that): "Loading the content" shown
test('checks task loading the content view content perm, explicit entry, results not fetched yet', async ({ itemContentPage, page }) => {
  await initAsDemoUser(page);
  await page.route(`${apiUrl}/items/6379723280369399253`, async route => {
    await route.fulfill({ json: taskResponse });
  });
  await itemContentPage.goto('a/6379723280369399253;p=;a=0');
  await page.route(`${apiUrl}/items/6379723280369399253/attempts?attempt_id=0`, async route => {
    await route.abort();
  });
  await itemContentPage.checksLoadingContentMessageIsVisible();
});

// Task, with view info perm, explicit entry, a result is returned (mock the service for that):
// "This activity requires explicit entry", item-display NOT in dom
test('checks explicit entry component is visible and item-display not in DOM', async ({ itemContentPage, page }) => {
  await page.route(`${apiUrl}/items/851659072357188051/attempts?attempt_id=0`, async route => {
    await route.fulfill({ json: attemptsResponse });
  });
  await Promise.all([
    itemContentPage.goto('/a/851659072357188051;p=4702,7528142386663912287,944619266928306927;pa=0'),
    itemContentPage.waitForItemResponse('851659072357188051'),
    itemContentPage.waitForBreadcrumbsResponse('4702/7528142386663912287/944619266928306927/851659072357188051', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksExplicitEntryIsVisible();
  await itemContentPage.checksItemDisplayIsNotVisible();
});

// Task, with view content perm, explicit entry, results fetched but empty so undefined current result:
// "This activity requires explicit entry", item-display NOT in dom
test('checks that explicit entry component is visible and item-display not in DOM with view content perm, explicit entry, no results', async ({ itemContentPage, page }) => {
  await Promise.all([
    itemContentPage.goto('/a/1480462971860767879;p=4702,7528142386663912287,944619266928306927;pa=0'),
    itemContentPage.waitForItemResponse('1480462971860767879'),
    itemContentPage.waitForBreadcrumbsResponse('4702/7528142386663912287/944619266928306927/1480462971860767879', 'parent_attempt_id=0'),
    itemContentPage.waitForAttemptsResponse('1480462971860767879', 'parent_attempt_id=0'),
  ]);
  await itemContentPage.checksExplicitEntryIsVisible();
});
