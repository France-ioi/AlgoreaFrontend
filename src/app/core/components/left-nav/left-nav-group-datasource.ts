import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupInfo } from 'src/app/shared/models/content/group-info';
import { GroupNavigationService, GroupNavigationChild, GroupNavigationData } from '../../http-services/group-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { LeftNavDataSource } from './left-nav-datasource';

export class LeftNavGroupDataSource extends LeftNavDataSource<GroupInfo, NavTreeElement> {

  constructor(
    private groupNavigationService: GroupNavigationService,
  ) {
    super();
  }

  addDetailsToTreeElement(contentInfo: GroupInfo, treeElement: NavTreeElement): NavTreeElement {
    return contentInfo.title ? { ...treeElement, title: contentInfo.title } : { ...treeElement };
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.groupNavigationService.getRoot().pipe(
      map(groups => groups.map(mapChild))
    );
  }

  fetchNavDataFromChild(id: string, _child: GroupInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(id).pipe(
      map(mapNavData)
    );
  }

  fetchNavData(el: NavTreeElement): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(el.id).pipe(
      map(mapNavData)
    );
  }

}

function mapChild(child: GroupNavigationChild): NavTreeElement {
  return {
    id: child.id,
    title: child.name,
    hasChildren: child.type !== 'User',
    type: child.type,
    locked: false,
  };
}

function mapNavData(data: GroupNavigationData): { parent: NavTreeElement, elements: NavTreeElement[] } {
  return {
    parent: {
      id: data.id,
      title: data.name,
      type: data.type,
      hasChildren: data.children.length > 0,
      locked: false,
    },
    elements: data.children.map(g => mapChild(g))
  };
}
