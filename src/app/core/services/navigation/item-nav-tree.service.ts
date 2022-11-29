import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, skip, switchMap, take } from 'rxjs/operators';
import { bestAttemptFromResults, defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { isSkill, ItemTypeCategory, typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { ContentRoute } from 'src/app/shared/routing/content-route';
import { isActivityInfo, isItemInfo, itemInfo, ItemInfo } from 'src/app/shared/models/content/item-info';
import { fullItemRoute, isItemRoute, isFullItemRoute, isRouteWithSelfAttempt } from 'src/app/shared/routing/item-route';
import { mayHaveChildren } from 'src/app/shared/helpers/item-type';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemNavigationChild, ItemNavigationData, ItemNavigationService } from '../../http-services/item-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { NavTreeService } from './nav-tree.service';
import { allowsViewingContent, canCurrentUserViewContent } from 'src/app/shared/models/domain/item-view-permission';
import { GroupWatchingService } from '../group-watching.service';

abstract class ItemNavTreeService extends NavTreeService<ItemInfo> {

  constructor(
    private category: ItemTypeCategory,
    currentContent: CurrentContentService,
    private groupWatchingService: GroupWatchingService,
    private itemNavService: ItemNavigationService,
    private itemRouter: ItemRouter,
  ) {
    super(currentContent);
    /* reload the item menus when watching changes */
    this.groupWatchingService.watchedGroup$.pipe(
      skip(1),
    ).subscribe(() => {
      this.retry();
    });
  }

  /**
   * Guess content info from the nav tree parent. (yypically so that we can fetch nav)
   * The element MUST have an attempt already, which should be the case for the parent.
   */
  contentInfoFromNavTreeParent(e: NavTreeElement): ItemInfo {
    if (!isItemRoute(e.route) || !isFullItemRoute(e.route)) throw new Error('expecting an item route in an item nav tree element');
    if (!isRouteWithSelfAttempt(e.route)) throw new Error('expecting nav menu parent route to have a self attempt');
    return itemInfo({ route: e.route });
  }

  canFetchChildren(content: ItemInfo): boolean {
    if (!content.details) return false; // no item detail yet -> no children
    if (!mayHaveChildren(content.details)) return false; // only chapters or skills may have children
    return !!content.route.attemptId; // an attempt is required to fetch children
  }

  fetchNavData(route: ContentRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    if (!isItemRoute(route)) throw new Error('expect requesting nav data with a route which is an item route');
    const attemptId = route.attemptId;
    if (!attemptId) throw new Error('attemptId cannot be determined (should have been checked by canFetchChildren)');
    return this.groupWatchingService.watchedGroup$.pipe(
      take(1),
      switchMap(watchedGroup => this.itemNavService.getItemNavigation(route.id,
        { attemptId, skillOnly: isSkill(route.contentType), watchedGroupId: watchedGroup?.route.id }
      )),
      map(data => this.mapNavData(data, route.path)),
    );
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.groupWatchingService.watchedGroup$.pipe(
      take(1),
      switchMap(watchedGroup => this.itemNavService.getRoots(this.category, watchedGroup?.route.id)),
      map(groups => groups.map(g => ({
        ...this.mapChild(g.item, defaultAttemptId, []),
        associatedGroupName: g.name,
        associatedGroupType: g.type,
      })))
    );
  }

  fetchNavDataFromChild(id: string, child: ItemInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    if (child.route.path.length === 0) throw new Error('unexpected empty path for child (fetchNavDataFromChild)');
    return this.groupWatchingService.watchedGroup$.pipe(
      take(1),
      switchMap(watchedGroup => this.itemNavService.getItemNavigation(id,
        { childRoute: child.route, skillOnly: isSkill(this.category), watchedGroupId: watchedGroup?.route.id }
      )),
      map(data => this.mapNavData(data, child.route.path.slice(0, -1)))
    );
  }

  addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: ItemInfo): NavTreeElement {
    const details = contentInfo.details;
    if (!details) return treeElement;
    return {
      ...treeElement,
      title: details.title ?? '',
      navigateTo: (preventFullFrame = false): void => this.itemRouter.navigateTo(contentInfo.route, { preventFullFrame }),
      score: details.bestScore !== undefined && details.currentScore !== undefined && details.validated !== undefined ? {
        bestScore: details.bestScore,
        currentScore: details.bestScore,
        validated: details.validated,
      } : undefined,
    };
  }

  dummyRootContent(): ItemInfo {
    return itemInfo({ route: fullItemRoute(this.category, 'dummy', [], { parentAttemptId: defaultAttemptId }) });
  }

  private mapChild(child: ItemNavigationChild, parentAttemptId: string, path: string[]): NavTreeElement {
    const currentResult = bestAttemptFromResults(child.results);
    const route = fullItemRoute(typeCategoryOfItem(child), child.id, path, { attemptId: currentResult?.attemptId, parentAttemptId });
    let score = undefined;
    if (!child.noScore) {
      if (child.watchedGroup && child.watchedGroup.avgScore !== undefined && child.watchedGroup.allValidated !== undefined) score = {
        bestScore: child.watchedGroup.avgScore,
        currentScore: child.watchedGroup.avgScore,
        validated: child.watchedGroup.allValidated
      };
      else if (currentResult) score = {
        bestScore: child.bestScore,
        currentScore: currentResult.scoreComputed,
        validated: currentResult.validated
      };
    }

    return {
      route,
      title: child.string.title ?? '',
      hasChildren: child.hasVisibleChildren && canCurrentUserViewContent(child),
      navigateTo: (preventFullFrame = false): void => this.itemRouter.navigateTo(route, { preventFullFrame }),
      locked: !allowsViewingContent(child.watchedGroup ?? child.permissions),
      score,
    };
  }

  private mapNavData(data: ItemNavigationData, pathToParent: string[]): { parent: NavTreeElement, elements: NavTreeElement[] } {
    const parentRoute = fullItemRoute(typeCategoryOfItem(data), data.id, pathToParent, { attemptId: data.attemptId });
    return {
      parent: {
        route: parentRoute,
        title: data.string.title ?? '',
        hasChildren: data.children.length > 0,
        navigateTo: (preventFullFrame = false): void => this.itemRouter.navigateTo(parentRoute, { preventFullFrame }),
        locked: !canCurrentUserViewContent(data),
      },
      elements: data.children.map(c => this.mapChild(c, data.attemptId, [ ...pathToParent, data.id ])),
    };
  }

}

@Injectable({
  providedIn: 'root'
})
export class ActivityNavTreeService extends ItemNavTreeService {
  constructor(
    currentContent: CurrentContentService,
    groupWatchingService: GroupWatchingService,
    itemNavService: ItemNavigationService,
    itemRouter: ItemRouter
  ) {
    super('activity', currentContent ,groupWatchingService, itemNavService, itemRouter);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && isActivityInfo(content);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillNavTreeService extends ItemNavTreeService {
  constructor(
    currentContent: CurrentContentService,
    groupWatchingService: GroupWatchingService,
    itemNavService: ItemNavigationService,
    itemRouter: ItemRouter
  ) {
    super('skill', currentContent, groupWatchingService, itemNavService, itemRouter);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && !isActivityInfo(content);
  }
}
