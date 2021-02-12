import { EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { ActivityInfo, ItemInfo, SkillInfo } from 'src/app/shared/services/current-content.service';
import { ItemNavigationService, NavMenuItem } from '../../http-services/item-navigation.service';
import { LeftNavDataSource } from './left-nav-datasource';

export abstract class LeftNavItemDataSource<ItemT extends ItemInfo> extends LeftNavDataSource<ItemT,NavMenuItem> {
  constructor(
    private category: ItemTypeCategory,
    private itemNavService: ItemNavigationService
  ) {
    super();
  }

  loadRootTreeData(): Observable<NavMenuItem[]> {
    return this.itemNavService.getRoot(this.category).pipe(
      map(items => items.items)
    );
  }

  loadNavDataFromChild(id: string, child: ItemT): Observable<{ parent: NavMenuItem, elements: NavMenuItem[] }> {
    return this.itemNavService.getNavDataFromChildRoute(id, child.route, isSkill(this.category)).pipe(
      map(items => ({ parent: items.parent, elements: items.items }))
    );
  }

  loadNavData(item: NavMenuItem): Observable<{ parent: NavMenuItem, elements: NavMenuItem[] }> {
    if (item.attemptId === null) return EMPTY;
    return this.itemNavService.getNavData(item.id, item.attemptId, isSkill(this.category)).pipe(
      map(nav => ({ parent: nav.parent, elements: nav.items }))
    );
  }

  addDetailsToTreeElement(contentInfo: ItemT, treeElement: NavMenuItem): NavMenuItem {
    const details = contentInfo.details;
    if (!details) return treeElement;
    return {
      ...treeElement,
      title: details.title,
      attemptId: details.attemptId ?? null,
      bestScore: details.bestScore,
      currentScore: details.currentScore,
      validated: details.validated
    };
  }

}

export class LeftNavActivityDataSource extends LeftNavItemDataSource<ActivityInfo> {
  constructor(itemNavService: ItemNavigationService) {
    super('activity', itemNavService);
  }
}

export class LeftNavSkillDataSource extends LeftNavItemDataSource<SkillInfo> {
  constructor(itemNavService: ItemNavigationService) {
    super('skill', itemNavService);
  }
}
