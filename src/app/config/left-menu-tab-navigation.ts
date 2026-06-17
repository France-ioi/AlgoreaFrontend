import { AppConfig, LeftMenuTabType } from '.';
import { defaultAttemptId } from '../items/models/attempts';
import { isSameOrDescendantOf } from '../models/routing/entity-route';
import { ItemRoute, itemRoute } from '../models/routing/item-route';

export function getItemTabContent(
  tabs: AppConfig['leftMenuTabs'],
  tabType: 'activities' | 'skills',
): { id: string, path: string[] } | undefined {
  const tab = tabs.find(t => t.type === tabType);
  if (!tab || !('content' in tab)) return undefined;
  return tab.content;
}

export function resolveSelectedRouteForTab(
  tabType: 'activities' | 'skills',
  storedActivity: ItemRoute | null,
  storedSkill: ItemRoute | null | undefined,
  activeRoute: ItemRoute | null,
): ItemRoute | null | undefined {
  const activeTabType = itemRouteToTabType(activeRoute);
  if (tabType === 'activities') {
    return storedActivity ?? (activeTabType === 'activities' ? activeRoute : null);
  }
  return storedSkill ?? (activeTabType === 'skills' ? activeRoute : null);
}

function itemRouteToTabType(route: ItemRoute | null): 'activities' | 'skills' | undefined {
  if (route === null) return undefined;
  return route.contentType === 'activity' ? 'activities' : 'skills';
}

export function resolveItemTabNavigationRoute(
  tabType: 'activities' | 'skills',
  tabContent: { id: string, path: string[] },
  currentTabType: LeftMenuTabType | undefined,
  selectedRoute: ItemRoute | null | undefined,
): ItemRoute {
  const contentType = tabType === 'activities' ? 'activity' : 'skill';
  const tabContentRoute = itemRoute(contentType, tabContent.id, {
    path: tabContent.path,
    parentAttemptId: defaultAttemptId,
  });

  if (currentTabType === tabType) {
    return tabContentRoute;
  }

  if (selectedRoute && isSameOrDescendantOf(tabContent, selectedRoute)) {
    return selectedRoute;
  }

  return tabContentRoute;
}
