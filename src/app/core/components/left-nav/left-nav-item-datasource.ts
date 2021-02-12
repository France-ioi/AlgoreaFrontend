import { EMPTY, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { errorState, FetchError, Fetching, mapErrorToState, Ready, readyState } from 'src/app/shared/helpers/state';
import { ActivityInfo, ItemInfo, SkillInfo } from 'src/app/shared/services/current-content.service';
import { ItemNavigationService, NavMenuItem } from '../../http-services/item-navigation.service';
import { NavTreeData } from '../../services/left-nav-loading/nav-tree-data';
import { LeftNavDataSource } from './left-nav-datasource';

type State = Ready<NavTreeData<NavMenuItem>>|Fetching|FetchError;

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

  contentId(contentInfo: ItemT): string {
    return contentInfo.route.id;
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

  loadChildrenOfSelectedElement(data: NavTreeData<NavMenuItem>): Observable<State> {
    const item = data.selectedElement();
    if (!item) return of(errorState(new Error('Cannot find selected element (or no selection) (unexpected)')));
    if (!item.hasChildren || item.attemptId === null) return EMPTY; // if no children, no need to fetch children

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(item.id, item.attemptId, isSkill(this.category)).pipe(
      map(nav => readyState(data.withUpdatedElement(item.id, el => ({ ...el, ...nav.parent, children: nav.items })))),
      mapErrorToState()
    );
  }

}

export class LeftNavActivityDataSource extends LeftNavItemDataSource<ActivityInfo> {

}

export class LeftNavSkillDataSource extends LeftNavItemDataSource<SkillInfo> {

}
