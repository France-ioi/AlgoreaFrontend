import { AppConfig } from '.';
import { defaultAttemptId } from '../items/models/attempts';
import { itemRoute } from '../models/routing/item-route';
import { getItemTabContent, resolveItemTabNavigationRoute, resolveSelectedRouteForTab } from './left-menu-tab-navigation';

const tabContent = { id: '4702', path: [] as string[] };
const skillTabContent = { id: '3000', path: [] as string[] };

const tabContentRoute = itemRoute('activity', tabContent.id, { path: tabContent.path, parentAttemptId: defaultAttemptId });
const skillTabContentRoute = itemRoute('skill', skillTabContent.id, { path: skillTabContent.path, parentAttemptId: defaultAttemptId });

const descendantActivityRoute = itemRoute('activity', '4102', { path: [ '4702' ], parentAttemptId: defaultAttemptId });
const descendantSkillRoute = itemRoute('skill', '3001', { path: [ '3000' ], parentAttemptId: defaultAttemptId });
const unrelatedSkillRoute = itemRoute('skill', '9999', { path: [], parentAttemptId: defaultAttemptId });

describe('getItemTabContent', () => {
  const tabs = [
    { type: 'activities', showTo: 'all', content: tabContent },
    { type: 'skills', showTo: 'all', content: skillTabContent },
    { type: 'groups', showTo: 'all' },
  ] as AppConfig['leftMenuTabs'];

  it('returns content for an activities or skills tab', () => {
    expect(getItemTabContent(tabs, 'activities')).toEqual(tabContent);
    expect(getItemTabContent(tabs, 'skills')).toEqual(skillTabContent);
  });

  it('returns undefined when the tab type is missing or has no content field', () => {
    expect(getItemTabContent(tabs.filter(t => t.type !== 'skills') as AppConfig['leftMenuTabs'], 'skills')).toBeUndefined();
    expect(getItemTabContent([], 'activities')).toBeUndefined();
  });
});

describe('resolveSelectedRouteForTab', () => {
  it('returns the stored route for the requested tab type', () => {
    expect(resolveSelectedRouteForTab('activities', descendantActivityRoute, descendantSkillRoute, null))
      .toEqual(descendantActivityRoute);
    expect(resolveSelectedRouteForTab('skills', descendantActivityRoute, descendantSkillRoute, null))
      .toEqual(descendantSkillRoute);
  });

  it('falls back to the active route when it matches the requested tab type', () => {
    expect(resolveSelectedRouteForTab('skills', null, null, descendantSkillRoute))
      .toEqual(descendantSkillRoute);
  });

  it('returns null when neither the store nor the active route matches the requested tab type', () => {
    expect(resolveSelectedRouteForTab('skills', null, null, descendantActivityRoute)).toBeNull();
  });
});

describe('resolveItemTabNavigationRoute', () => {
  describe('activities tab', () => {
    it('returns tab content when current content is already on the activities tab', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, 'activities', descendantActivityRoute))
        .toEqual(tabContentRoute);
    });

    it('restores the selected route when coming from another tab and it is a descendant', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, 'skills', descendantActivityRoute))
        .toEqual(descendantActivityRoute);
    });

    it('returns tab content when the selected route is outside the tab subtree', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, 'skills', unrelatedSkillRoute))
        .toEqual(tabContentRoute);
    });

    it('returns tab content when selectedRoute is null', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, 'skills', null))
        .toEqual(tabContentRoute);
    });

    it('restores the selected route when current tab type is unknown and selected route is a descendant', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, undefined, descendantActivityRoute))
        .toEqual(descendantActivityRoute);
    });

    it('returns tab content when selectedRoute is undefined', () => {
      expect(resolveItemTabNavigationRoute('activities', tabContent, 'groups', undefined))
        .toEqual(tabContentRoute);
    });
  });

  describe('skills tab', () => {
    it('returns tab content when current content is already on the skills tab', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, 'skills', descendantSkillRoute))
        .toEqual(skillTabContentRoute);
    });

    it('restores the selected route when coming from another tab and it is a descendant', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, 'activities', descendantSkillRoute))
        .toEqual(descendantSkillRoute);
    });

    it('returns tab content when the selected route is outside the tab subtree', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, 'activities', unrelatedSkillRoute))
        .toEqual(skillTabContentRoute);
    });

    it('returns tab content when selectedRoute is null', () => {
      expect(resolveItemTabNavigationRoute('skills', skillTabContent, 'activities', null))
        .toEqual(skillTabContentRoute);
    });
  });
});
