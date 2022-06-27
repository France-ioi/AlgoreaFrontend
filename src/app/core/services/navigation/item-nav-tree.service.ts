import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults, defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { isSkill, ItemTypeCategory, typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { isActivityInfo, isItemInfo, ItemInfo } from 'src/app/shared/models/content/item-info';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { mayHaveChildren } from 'src/app/shared/helpers/item-type';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemNavigationChild, ItemNavigationData, ItemNavigationService } from '../../http-services/item-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { NavTreeService } from './nav-tree.service';

abstract class ItemNavTreeService extends NavTreeService<ItemInfo> {

  constructor(
    private category: ItemTypeCategory,
    currentContent: CurrentContentService,
    private itemNavService: ItemNavigationService,
    private itemRouter: ItemRouter,
  ) {
    super(currentContent);
  }

  canFetchChildren(content: ItemInfo): boolean {
    if (!content.details) return false; // no item detail yet -> no children
    if (!mayHaveChildren(content.details)) return false; // only chapters or skills may have children
    return !!(content.route.attemptId || content.details.attemptId); // an attempt is required to fetch children
  }

  fetchChildren(content: ItemInfo): Observable<NavTreeElement[]> {
    const attemptId = content.route.attemptId ?? content.details?.attemptId;
    if (!attemptId) throw new Error('attemptId cannot be determined (should have been checked by canFetchChildren)');
    return this.itemNavService.getItemNavigation(content.route.id, attemptId, isSkill(content.route.contentType)).pipe(
      map(data => this.mapNavData(data).elements),
    );
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.itemNavService.getRoots(this.category).pipe(
      map(groups => groups.map(g => ({
        ...this.mapChild(g.item, defaultAttemptId),
        associatedGroupName: g.name,
        associatedGroupType: g.type,
      })))
    );
  }

  fetchNavDataFromChild(id: string, child: ItemInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.itemNavService.getItemNavigationFromChildRoute(id, child.route, isSkill(this.category)).pipe(
      map(data => this.mapNavData(data))
    );
  }

  addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: ItemInfo): NavTreeElement {
    const details = contentInfo.details;
    if (!details) return treeElement;
    return {
      ...treeElement,
      title: details.title ?? '',
      navigateTo: (_path: string[], preventFullFrame = false): void => this.itemRouter.navigateTo(contentInfo.route, { preventFullFrame }),
      score: details.bestScore !== undefined && details.currentScore !== undefined && details.validated !== undefined ? {
        bestScore: details.bestScore,
        currentScore: details.bestScore,
        validated: details.validated,
      } : undefined,
    };
  }

  private mapChild(child: ItemNavigationChild, parentAttemptId: string): NavTreeElement {
    const currentResult = bestAttemptFromResults(child.results);
    return {
      id: child.id,
      title: child.string.title ?? '',
      hasChildren: child.hasVisibleChildren && ![ 'none', 'info' ].includes(child.permissions.canView),
      navigateTo: (path, preventFullFrame = false): void => this.itemRouter.navigateTo(
        fullItemRoute(typeCategoryOfItem(child), child.id, path, { attemptId: currentResult?.attemptId, parentAttemptId }),
        { preventFullFrame },
      ),
      locked: child.permissions.canView === 'info',
      score: !child.noScore && currentResult ? {
        bestScore: child.bestScore,
        currentScore: currentResult.scoreComputed,
        validated: currentResult.validated
      } : undefined,
    };
  }

  private mapNavData(data: ItemNavigationData): { parent: NavTreeElement, elements: NavTreeElement[] } {
    return {
      parent: {
        id: data.id,
        title: data.string.title ?? '',
        hasChildren: data.children.length > 0,
        navigateTo: (path, preventFullFrame = false): void => this.itemRouter.navigateTo(
          fullItemRoute(typeCategoryOfItem(data), data.id, path, { attemptId: data.attemptId }),
          { preventFullFrame },
        ),
        locked: data.permissions.canView === 'info'
      },
      elements: data.children.map(c => this.mapChild(c, data.attemptId))
    };
  }

}

@Injectable({
  providedIn: 'root'
})
export class ActivityNavTreeService extends ItemNavTreeService {
  constructor(currentContent: CurrentContentService, itemNavService: ItemNavigationService, itemRouter: ItemRouter) {
    super('activity', currentContent, itemNavService, itemRouter);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && isActivityInfo(content);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillNavTreeService extends ItemNavTreeService {
  constructor(currentContent: CurrentContentService, itemNavService: ItemNavigationService, itemRouter: ItemRouter) {
    super('skill', currentContent, itemNavService, itemRouter);
  }

  isOfContentType(content: ContentInfo|null): content is ItemInfo {
    return isItemInfo(content) && !isActivityInfo(content);
  }
}
