import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, skip, switchMap, take } from 'rxjs/operators';
import { bestAttemptFromResults, defaultAttemptId } from 'src/app/items/models/attempts';
import { ItemTypeCategory, typeCategoryOfItem, itemTypeCategoryEnum as c } from 'src/app/items/models/item-type';
import { ContentInfo } from 'src/app/models/content/content-info';
import { isActivityInfo, isItemInfo, itemInfo, ItemInfo } from 'src/app/models/content/item-info';
import { itemRoute, isItemRoute, isFullItemRoute, isRouteWithSelfAttempt } from 'src/app/models/routing/item-route';
import { mayHaveChildren } from 'src/app/items/models/item-type';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ItemNavigationChild, ItemNavigationData, ItemNavigationService } from '../../data-access/item-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { NavTreeService } from './nav-tree.service';
import { allowsViewingContent, canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { isGroupTypeVisible } from 'src/app/groups/models/group-types';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { EntityPathRoute } from 'src/app/models/routing/entity-route';

abstract class ItemNavTreeService extends NavTreeService<ItemInfo> {

  constructor(
    private category: ItemTypeCategory,
    currentContent: CurrentContentService,
    private itemNavService: ItemNavigationService,
    private itemRouter: ItemRouter,
    private store: Store,
  ) {
    super(currentContent);
    /* reload the item menus when observed group changes */
    this.store.select(fromObservation.selectObservedGroupId).pipe(
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
    if (!isFullItemRoute(e.route)) throw new Error('expecting an item route in an item nav tree element');
    if (!isRouteWithSelfAttempt(e.route)) throw new Error('expecting nav menu parent route to have a self attempt');
    return itemInfo({ route: e.route });
  }

  canFetchChildren(content: ItemInfo): boolean {
    if (!content.details) return false; // no item detail yet -> no children
    if (!mayHaveChildren(content.details)) return false; // only chapters or skills may have children
    return !!content.route.attemptId; // an attempt is required to fetch children
  }

  fetchNavData(route: EntityPathRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    if (!isItemRoute(route)) throw new Error('expect requesting nav data with a route which is an item route');
    const attemptId = route.attemptId;
    if (!attemptId) throw new Error('attemptId cannot be determined (should have been checked by canFetchChildren)');
    return this.store.select(fromObservation.selectObservedGroupId).pipe(
      take(1),
      switchMap(observedGroupId => this.itemNavService.getItemNavigation(route.id,
        { attemptId, skillOnly: route.contentType === c.skill, watchedGroupId: observedGroupId ?? undefined }
      )),
      map(data => this.mapNavData(data, route.path)),
    );
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.store.select(fromObservation.selectObservedGroupId).pipe(
      take(1),
      switchMap(observedGroupId => this.itemNavService.getRoots(this.category, observedGroupId ?? undefined)),
      map(items => items.map(i => ({
        ...this.mapChild(i, defaultAttemptId, []),
        associatedGroupNames: i.groups.filter(g => isGroupTypeVisible(g.type)).map(g => g.name),
      })))
    );
  }

  fetchNavDataFromChild(id: string, child: ItemInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    if (child.route.path.length === 0) throw new Error('unexpected empty path for child (fetchNavDataFromChild)');
    return this.store.select(fromObservation.selectObservedGroupId).pipe(
      take(1),
      switchMap(observedGroupId => this.itemNavService.getItemNavigation(id,
        { childRoute: child.route, skillOnly: this.category === c.skill, watchedGroupId: observedGroupId ?? undefined }
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
      navigateTo: (preventFullFrame = false): void =>
        this.itemRouter.navigateTo(contentInfo.route, { preventFullFrame, useCurrentObservation: true }),
      score: details.bestScore !== undefined && details.currentScore !== undefined && details.validated !== undefined ? {
        bestScore: details.bestScore,
        currentScore: details.bestScore,
        validated: details.validated,
      } : treeElement.score,
    };
  }

  dummyRootContent(): ItemInfo {
    return itemInfo({ route: itemRoute(this.category, 'dummy', { path: [], parentAttemptId: defaultAttemptId }) });
  }

  private mapChild(child: ItemNavigationChild, parentAttemptId: string, path: string[]): NavTreeElement {
    const currentResult = bestAttemptFromResults(child.results);
    const route = itemRoute(typeCategoryOfItem(child), child.id, { path, attemptId: currentResult?.attemptId, parentAttemptId });
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
      navigateTo: (preventFullFrame = false): void => this.itemRouter.navigateTo(route, { preventFullFrame, useCurrentObservation: true }),
      locked: !allowsViewingContent(child.watchedGroup ?? child.permissions),
      score,
    };
  }

  private mapNavData(data: ItemNavigationData, pathToParent: string[]): { parent: NavTreeElement, elements: NavTreeElement[] } {
    const parentRoute = itemRoute(typeCategoryOfItem(data), data.id, { path: pathToParent, attemptId: data.attemptId });
    return {
      parent: {
        route: parentRoute,
        title: data.string.title ?? '',
        hasChildren: data.children.length > 0,
        navigateTo: (preventFullFrame = false): void =>
          this.itemRouter.navigateTo(parentRoute, { preventFullFrame, useCurrentObservation: true }),
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
  constructor() {
    const currentContent = inject(CurrentContentService);
    const itemNavService = inject(ItemNavigationService);
    const itemRouter = inject(ItemRouter);
    const store = inject<Store>(Store);

    super('activity', currentContent, itemNavService, itemRouter, store);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && isActivityInfo(content);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillNavTreeService extends ItemNavTreeService {
  constructor() {
    const currentContent = inject(CurrentContentService);
    const itemNavService = inject(ItemNavigationService);
    const itemRouter = inject(ItemRouter);
    const store = inject<Store>(Store);

    super('skill', currentContent, itemNavService, itemRouter, store);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && !isActivityInfo(content);
  }
}
