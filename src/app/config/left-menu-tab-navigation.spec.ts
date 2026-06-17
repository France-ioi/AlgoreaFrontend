import { defaultAttemptId } from '../items/models/attempts';
import { userInfo } from '../models/content/group-info';
import { itemInfo } from '../models/content/item-info';
import { itemRoute } from '../models/routing/item-route';
import { LeftMenuTabView } from './left-menu-config.service';
import { resolveActiveTabId, resolveItemTabNavigationRoute } from './left-menu-tab-navigation';

const tabContent = { id: '4702', path: [] as string[] };
const nestedTabContent = { id: '7528142386663912287', path: [ '4702' ] as string[] };
const skillTabContent = { id: '3000', path: [] as string[] };

const tabContentRoute = itemRoute('activity', tabContent.id, { path: tabContent.path, parentAttemptId: defaultAttemptId });
const nestedTabContentRoute = itemRoute('activity', nestedTabContent.id, {
  path: nestedTabContent.path,
  parentAttemptId: defaultAttemptId,
});
const skillTabContentRoute = itemRoute('skill', skillTabContent.id, { path: skillTabContent.path, parentAttemptId: defaultAttemptId });

const descendantActivityRoute = itemRoute('activity', '4102', { path: [ '4702' ], parentAttemptId: defaultAttemptId });
const nestedDescendantActivityRoute = itemRoute('activity', '9999', {
  path: [ '4702', '7528142386663912287' ],
  parentAttemptId: defaultAttemptId,
});
const descendantSkillRoute = itemRoute('skill', '3001', { path: [ '3000' ], parentAttemptId: defaultAttemptId });
const unrelatedSkillRoute = itemRoute('skill', '9999', { path: [], parentAttemptId: defaultAttemptId });

const visibleTabs: LeftMenuTabView[] = [
  { id: 0, type: 'activities', icon: 'ph ph-presentation', content: tabContent },
  { id: 1, type: 'activities', icon: 'ph ph-presentation', content: nestedTabContent },
  { id: 2, type: 'skills', icon: 'ph ph-graduation-cap', content: skillTabContent },
  { id: 3, type: 'groups', icon: 'ph ph-users' },
];

describe('resolveActiveTabId', () => {
  it('picks the activities tab with the longest matching path for a nested descendant', () => {
    const content = itemInfo({ route: nestedDescendantActivityRoute });
    expect(resolveActiveTabId(content, visibleTabs)).toBe(1);
  });

  it('picks the root activities tab for a shallow descendant', () => {
    const content = itemInfo({ route: descendantActivityRoute });
    expect(resolveActiveTabId(content, visibleTabs)).toBe(0);
  });

  it('picks the skills tab for skill content', () => {
    const content = itemInfo({ route: descendantSkillRoute });
    expect(resolveActiveTabId(content, visibleTabs)).toBe(2);
  });

  it('falls back to the first tab of the category when no content matches', () => {
    const content = itemInfo({ route: itemRoute('activity', 'unrelated', { path: [], parentAttemptId: defaultAttemptId }) });
    expect(resolveActiveTabId(content, visibleTabs)).toBe(0);
  });

  it('returns the first visible tab when content is null', () => {
    expect(resolveActiveTabId(null, visibleTabs)).toBe(0);
  });

  it('falls back to the activities tab when group content has no matching tab', () => {
    const tabs: LeftMenuTabView[] = [
      { id: 0, type: 'activities', icon: 'ph ph-presentation', content: tabContent },
    ];
    expect(resolveActiveTabId(userInfo({}), tabs)).toBe(0);
  });
});

describe('resolveItemTabNavigationRoute', () => {
  describe('activities tab', () => {
    it('returns tab content when the tab is already active', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, true, descendantActivityRoute, true))
        .toEqual(tabContentRoute);
    });

    it('restores the selected route when not viewing an activity and it is a descendant', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, descendantActivityRoute, false))
        .toEqual(descendantActivityRoute);
    });

    it('returns tab content when viewing an activity even if the selected route is a descendant', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, nestedDescendantActivityRoute, true))
        .toEqual(tabContentRoute);
    });

    it('returns tab content when the selected route is outside the tab subtree', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, unrelatedSkillRoute, false))
        .toEqual(tabContentRoute);
    });

    it('returns tab content when selectedRoute is null', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, null, false))
        .toEqual(tabContentRoute);
    });

    it('returns tab content when selectedRoute is undefined', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, undefined, false))
        .toEqual(tabContentRoute);
    });
  });

  describe('skills tab', () => {
    it('returns tab content when the tab is already active', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, true, descendantSkillRoute, true))
        .toEqual(skillTabContentRoute);
    });

    it('restores the selected route when not viewing a skill and it is a descendant', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, false, descendantSkillRoute, false))
        .toEqual(descendantSkillRoute);
    });

    it('returns tab content when viewing a skill even if the selected route is a descendant', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, false, descendantSkillRoute, true))
        .toEqual(skillTabContentRoute);
    });

    it('returns tab content when the selected route is outside the tab subtree', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, false, unrelatedSkillRoute, false))
        .toEqual(skillTabContentRoute);
    });

    it('returns tab content when selectedRoute is null', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, false, null, false))
        .toEqual(skillTabContentRoute);
    });
  });

  describe('nested activities tab', () => {
    it('returns nested tab root when the nested tab is already active', () => {
      expect(resolveItemTabNavigationRoute('activities', nestedTabContent, true, nestedDescendantActivityRoute, true))
        .toEqual(nestedTabContentRoute);
    });

    it('returns parent tab root when viewing a nested activity and clicking the parent tab', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, false, nestedDescendantActivityRoute, true))
        .toEqual(tabContentRoute);
    });
  });
});
