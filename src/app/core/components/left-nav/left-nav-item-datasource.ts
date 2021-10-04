import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults, defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { isSkill, ItemTypeCategory, typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { ItemInfo } from 'src/app/shared/models/content/item-info';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { ItemNavigationChild, ItemNavigationData, ItemNavigationService } from '../../http-services/item-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { LeftNavDataSource } from './left-nav-datasource';

export abstract class LeftNavItemDataSource extends LeftNavDataSource<ItemInfo> {
  constructor(
    private category: ItemTypeCategory,
    private itemNavService: ItemNavigationService,
    private itemRouter: ItemRouter,
  ) {
    super();
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.itemNavService.getRoots(this.category).pipe(
      map(groups => groups.map(g => ({
        ...this.mapChild(g.item, defaultAttemptId),
        associatedGroup: g.name,
      })))
    );
  }

  fetchNavDataFromChild(id: string, child: ItemInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.itemNavService.getItemNavigationFromChildRoute(id, child.route, isSkill(this.category)).pipe(
      map(data => this.mapNavData(data))
    );
  }

  addDetailsToTreeElement(contentInfo: ItemInfo, treeElement: NavTreeElement): NavTreeElement {
    let element = treeElement;
    if (contentInfo.details) {
      const details = contentInfo.details;
      element = {
        ...element,
        title: details.title ?? '',
        navigateTo: (): void => this.itemRouter.navigateTo(contentInfo.route),
        score: details.bestScore !== undefined && details.currentScore !== undefined && details.validated !== undefined ? {
          bestScore: details.bestScore,
          currentScore: details.bestScore,
          validated: details.validated,
        } : undefined,
      };
    }
    const attemptId = contentInfo.details?.attemptId;
    if (contentInfo.navData && attemptId) {
      element = {
        ...element,
        children: contentInfo.navData.children.map(c => this.mapChild(c, attemptId)),
      };
    }
    return element;
  }

  private mapChild(child: ItemNavigationChild, parentAttemptId: string): NavTreeElement {
    const currentResult = bestAttemptFromResults(child.results);
    return {
      id: child.id,
      title: child.string.title ?? '',
      hasChildren: child.hasVisibleChildren && ![ 'none', 'info' ].includes(child.permissions.canView),
      navigateTo: (path): void => this.itemRouter.navigateTo(
        fullItemRoute(typeCategoryOfItem(child), child.id, path, { attemptId: currentResult?.attemptId, parentAttemptId })
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
        navigateTo: (path): void => this.itemRouter.navigateTo(
          fullItemRoute(typeCategoryOfItem(data), data.id, path, { attemptId: data.attemptId })
        ),
        locked: data.permissions.canView === 'info'
      },
      elements: data.children.map(c => this.mapChild(c, data.attemptId))
    };
  }

}

export class LeftNavActivityDataSource extends LeftNavItemDataSource {
  constructor(itemNavService: ItemNavigationService, itemRouter: ItemRouter) {
    super('activity', itemNavService, itemRouter);
  }
}

export class LeftNavSkillDataSource extends LeftNavItemDataSource {
  constructor(itemNavService: ItemNavigationService, itemRouter: ItemRouter) {
    super('skill', itemNavService, itemRouter);
  }
}
