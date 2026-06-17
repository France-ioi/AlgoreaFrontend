import { defaultAttemptId } from '../items/models/attempts';
import { ContentInfo } from '../models/content/content-info';
import { isGroupInfo, isMyGroupsInfo, isUserInfo } from '../models/content/group-info';
import { isActivityInfo, isItemInfo } from '../models/content/item-info';
import { isSameOrDescendantOf } from '../models/routing/entity-route';
import { ItemRoute, itemRoute } from '../models/routing/item-route';
import { LeftMenuTabView } from './left-menu-config.service';
import { LeftMenuTabType } from '.';

type ItemTabWithContent = LeftMenuTabView & { content: { id: string, path: string[] } };

function isMatchingItemTab(
  tab: LeftMenuTabView,
  contentTabType: 'activities' | 'skills',
  route: { id: string, path: string[] },
): tab is ItemTabWithContent {
  return tab.type === contentTabType
    && tab.content !== undefined
    && isSameOrDescendantOf(tab.content, route);
}

export function resolveActiveTabId(
  content: ContentInfo | null,
  visibleTabs: LeftMenuTabView[],
): number | undefined {
  if (visibleTabs.length === 0) return undefined;

  const contentTabType = contentToTabType(content);
  if (!contentTabType) {
    return visibleTabs[0]?.id;
  }

  if ((contentTabType === 'activities' || contentTabType === 'skills') && isItemInfo(content)) {
    const matchingTabs = visibleTabs.filter(tab => isMatchingItemTab(tab, contentTabType, content.route));

    if (matchingTabs.length > 0) {
      const bestMatch = matchingTabs.reduce((best, tab) =>
        (tab.content.path.length > best.content.path.length ? tab : best),
      );
      return bestMatch.id;
    }
  }

  const matchingTabId = visibleTabs.find(t => t.type === contentTabType)?.id;
  if (matchingTabId !== undefined) {
    return matchingTabId;
  }

  return visibleTabs.find(t => t.type === 'activities')?.id ?? visibleTabs[0]?.id;
}

export function resolveItemTabNavigationRoute(
  tabType: 'activities' | 'skills',
  tabContent: { id: string, path: string[] },
  isActiveTab: boolean,
  selectedRoute: ItemRoute | null | undefined,
  viewingItemOfSameCategory: boolean,
): ItemRoute {
  const contentType = tabType === 'activities' ? 'activity' : 'skill';
  const tabContentRoute = itemRoute(contentType, tabContent.id, {
    path: tabContent.path,
    parentAttemptId: defaultAttemptId,
  });

  if (isActiveTab) {
    return tabContentRoute;
  }

  if (
    !viewingItemOfSameCategory
    && selectedRoute
    && isSameOrDescendantOf(tabContent, selectedRoute)
  ) {
    return selectedRoute;
  }

  return tabContentRoute;
}

function contentToTabType(content: ContentInfo | null): LeftMenuTabType | undefined {
  if (content === null) return undefined;
  if (content.type === 'community') return 'community';
  if (isGroupInfo(content) || isMyGroupsInfo(content) || isUserInfo(content)) return 'groups';
  if (isItemInfo(content)) {
    return isActivityInfo(content) ? 'activities' : 'skills';
  }
  return undefined;
}
