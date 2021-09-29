import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { ItemInfo } from 'src/app/shared/models/content/item-info';
import { ItemNavigationService, NavMenuItem } from '../../http-services/item-navigation.service';
import { LeftNavDataSource } from './left-nav-datasource';

export abstract class LeftNavItemDataSource<ItemT extends ItemInfo> extends LeftNavDataSource<ItemT,NavMenuItem> {
  constructor(
    private category: ItemTypeCategory,
    private itemNavService: ItemNavigationService
  ) {
    super();
  }

  fetchRootTreeData(): Observable<NavMenuItem[]> {
    return this.itemNavService.getRoot(this.category).pipe(
      map(items => items.items)
    );
  }

  fetchNavDataFromChild(id: string, child: ItemT): Observable<{ parent: NavMenuItem, elements: NavMenuItem[] }> {
    return this.itemNavService.getNavDataFromChildRoute(id, child.route, isSkill(this.category)).pipe(
      map(items => ({ parent: items.parent, elements: items.items }))
    );
  }

  addDetailsToTreeElement(contentInfo: ItemT, treeElement: NavMenuItem): NavMenuItem {
    const details = contentInfo.details;
    if (!details) return treeElement;
    const navMenuItem = {
      ...treeElement,
      title: details.title ?? '',
      attemptId: details.attemptId ?? null,
      bestScore: details.bestScore,
      currentScore: details.currentScore,
      validated: details.validated
    };
    const navData = contentInfo.navData;
    if (!navData) return navMenuItem;
    return {
      ...navMenuItem,
      children: navData.children.map(c => {
        const currentResult = bestAttemptFromResults(c.results);
        return {
          id: c.id,
          title: c.string.title ?? '',
          hasChildren: c.hasVisibleChildren && ![ 'none', 'info' ].includes(c.permissions.canView),
          attemptId: currentResult?.attemptId ?? null,
          bestScore: c.noScore ? undefined : c.bestScore,
          currentScore: c.noScore ? undefined : currentResult?.scoreComputed,
          validated: c.noScore ? undefined : currentResult?.validated,
          locked: c.permissions.canView === 'info',
        };
      })
    };
  }

}

export class LeftNavActivityDataSource extends LeftNavItemDataSource<ItemInfo> {
  constructor(itemNavService: ItemNavigationService) {
    super('activity', itemNavService);
  }
}

export class LeftNavSkillDataSource extends LeftNavItemDataSource<ItemInfo> {
  constructor(itemNavService: ItemNavigationService) {
    super('skill', itemNavService);
  }
}
