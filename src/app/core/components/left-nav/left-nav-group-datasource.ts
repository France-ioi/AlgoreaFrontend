import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupInfo } from 'src/app/shared/models/content/group-info';
import { groupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { GroupNavigationService, GroupNavigationChild, GroupNavigationData } from '../../http-services/group-navigation.service';
import { GroupManagership, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { LeftNavDataSource } from './left-nav-datasource';

export class LeftNavGroupDataSource extends LeftNavDataSource<GroupInfo> {

  constructor(
    private groupNavigationService: GroupNavigationService,
    private groupRouter: GroupRouter,
  ) {
    super();
  }

  addDetailsToTreeElement(contentInfo: GroupInfo, treeElement: NavTreeElement): NavTreeElement {
    let group = treeElement;
    if (contentInfo.title) group = { ...group, title: contentInfo.title };
    if (contentInfo.navData) group = { ...group, children: contentInfo.navData.children.map(g => this.mapChild(g)) };
    return group;
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.groupNavigationService.getRoot().pipe(
      map(groups => groups.map(g => this.mapChild(g)))
    );
  }

  fetchNavDataFromChild(id: string, _child: GroupInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(id).pipe(
      map(data => this.mapNavData(data))
    );
  }

  fetchNavData(el: NavTreeElement): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(el.id).pipe(
      map(data => this.mapNavData(data))
    );
  }

  private mapChild(child: GroupNavigationChild): NavTreeElement {
    return {
      id: child.id,
      title: child.name,
      hasChildren: child.type !== 'User',
      navigateTo: (path): void => this.groupRouter.navigateTo(groupRoute({ id: child.id, isUser: false }, path)),
      groupRelation: { isMember: child.currentUserMembership !== 'none', isManager: mapMananagership(child.currentUserManagership) }
    };
  }

  private mapNavData(data: GroupNavigationData): { parent: NavTreeElement, elements: NavTreeElement[] } {
    return {
      parent: {
        id: data.id,
        title: data.name,
        hasChildren: data.children.length > 0,
        navigateTo: (path): void => this.groupRouter.navigateTo(groupRoute({ id: data.id, isUser: false }, path))
      },
      elements: data.children.map(g => this.mapChild(g))
    };
  }

}

function mapMananagership(managership: 'none'|'direct'|'ancestor'|'descendant'): GroupManagership {
  if (managership === 'none') return GroupManagership.False;
  if (managership === 'descendant') return GroupManagership.Descendant;
  return GroupManagership.True;
}
