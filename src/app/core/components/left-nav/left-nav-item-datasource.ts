import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { ItemInfo } from 'src/app/shared/models/content/item-info';
import { ItemNavigationChild, ItemNavigationData, ItemNavigationService } from '../../http-services/item-navigation.service';
import { LeftNavDataSource } from './left-nav-datasource';

export interface NavMenuItem {
  id: string,
  title: string, // not null to implement NavTreeElement
  hasChildren: boolean,
  groupName?: string,
  attemptId: string|null,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
  children?: NavMenuItem[], // placeholder for children when fetched (may 'hasChildren' with 'children' not set)
  locked: boolean,
}

export abstract class LeftNavItemDataSource<ItemT extends ItemInfo> extends LeftNavDataSource<ItemT,NavMenuItem> {
  constructor(
    private category: ItemTypeCategory,
    private itemNavService: ItemNavigationService
  ) {
    super();
  }

  fetchRootTreeData(): Observable<NavMenuItem[]> {
    return this.itemNavService.getRoots(this.category).pipe(
      map(groups => groups.map(g => ({
        ...mapChild(g.item),
        groupName: g.name,
      })))
    );
  }

  fetchNavDataFromChild(id: string, child: ItemT): Observable<{ parent: NavMenuItem, elements: NavMenuItem[] }> {
    return this.itemNavService.getItemNavigationFromChildRoute(id, child.route, isSkill(this.category)).pipe(
      map(mapNavData)
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

function mapChild(child: ItemNavigationChild): NavMenuItem {
  const currentResult = bestAttemptFromResults(child.results);
  return {
    id: child.id,
    title: child.string.title ?? '',
    hasChildren: child.hasVisibleChildren && ![ 'none', 'info' ].includes(child.permissions.canView),
    attemptId: currentResult?.attemptId ?? null,
    bestScore: child.noScore ? undefined : child.bestScore,
    currentScore: child.noScore ? undefined : currentResult?.scoreComputed,
    validated: child.noScore ? undefined : currentResult?.validated,
    locked: child.permissions.canView === 'info',
  };
}

function mapNavData(data: ItemNavigationData): { parent: NavMenuItem, elements: NavMenuItem[] } {
  return {
    parent: {
      id: data.id,
      title: data.string.title ?? '',
      hasChildren: data.children.length > 0,
      attemptId: data.attemptId,
      locked: data.permissions.canView === 'info'
    },
    elements: data.children.map(mapChild)
  };
}
