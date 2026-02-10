import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContentInfo } from 'src/app/models/content/content-info';
import { groupInfo, GroupInfo, isGroupInfo } from 'src/app/models/content/group-info';
import { groupRoute, isGroupRoute, isUser } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { GroupNavigationService, GroupNavigationChild, GroupNavigationData } from '../../data-access/group-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { NavTreeService } from './nav-tree.service';
import { EntityPathRoute } from 'src/app/models/routing/entity-route';
import { isCurrentUserMember } from 'src/app/groups/models/group-membership';

@Injectable({
  providedIn: 'root'
})
export class GroupNavTreeService extends NavTreeService<GroupInfo> {
  private groupNavigationService = inject(GroupNavigationService);
  private groupRouter = inject(GroupRouter);

  constructor() {
    const currentContent = inject(CurrentContentService);
    super(currentContent);
  }

  contentInfoFromNavTreeParent(e: NavTreeElement): GroupInfo {
    if (!isGroupRoute(e.route)) throw new Error('expect group nav tree to use group routes');
    return groupInfo({ route: e.route });
  }

  canFetchChildren(content: GroupInfo): boolean {
    return !isUser(content.route);
  }

  fetchNavData(route: EntityPathRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(route.id).pipe(
      map(data => this.mapNavData(data, route.path))
    );
  }

  isOfContentType(content: ContentInfo|null): content is GroupInfo {
    return isGroupInfo(content);
  }

  addDetailsToTreeElement(treeElement: NavTreeElement, _contentInfo: GroupInfo): NavTreeElement {
    return treeElement;
  }

  fetchRootTreeData(): Observable<NavTreeElement[]> {
    return this.groupNavigationService.getRoot().pipe(
      map(groups => groups.map(g => this.mapChild(g, [])))
    );
  }

  fetchNavDataFromChild(id: string, child: GroupInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    if (child.route.path.length === 0) throw new Error('expected non-empty path for group child in left menu');
    return this.groupNavigationService.getGroupNavigation(id).pipe(
      map(data => this.mapNavData(data, child.route.path.slice(0, -1)))
    );
  }

  dummyRootContent(): GroupInfo {
    return groupInfo({ route: groupRoute({ id: 'dummy', isUser: false }, []) });
  }

  private mapChild(child: GroupNavigationChild, path: string[]): NavTreeElement {
    const route = groupRoute({ id: child.id, isUser: false }, path);
    return {
      route: route,
      title: child.name,
      hasChildren: child.type !== 'User',
      navigateTo: (): void => this.groupRouter.navigateTo(route),
      groupRelation: { isMember: isCurrentUserMember(child), managership: child.currentUserManagership }
    };
  }

  private mapNavData(data: GroupNavigationData, pathToParent: string[]): { parent: NavTreeElement, elements: NavTreeElement[] } {
    const parentRoute = groupRoute({ id: data.id, isUser: false }, pathToParent);
    return {
      parent: {
        route: parentRoute,
        title: data.name,
        hasChildren: data.children.length > 0,
        navigateTo: (): void => this.groupRouter.navigateTo(parentRoute),
      },
      elements: data.children.map(g => this.mapChild(g, [ ...pathToParent, data.id ]))
    };
  }

}
