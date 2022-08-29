import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { groupInfo, GroupInfo, isGroupInfo } from 'src/app/shared/models/content/group-info';
import { ContentRoute } from 'src/app/shared/routing/content-route';
import { groupRoute, isGroupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { GroupNavigationService, GroupNavigationChild, GroupNavigationData } from '../../http-services/group-navigation.service';
import { NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { NavTreeService } from './nav-tree.service';

@Injectable({
  providedIn: 'root'
})
export class GroupNavTreeService extends NavTreeService<GroupInfo> {

  constructor(
    currentContent: CurrentContentService,
    private groupNavigationService: GroupNavigationService,
    private groupRouter: GroupRouter,
  ) {
    super(currentContent);
  }

  contentInfoFromNavTreeParent(e: NavTreeElement): GroupInfo {
    if (!isGroupRoute(e.route)) throw new Error('expect group nav tree to use group routes');
    return groupInfo({ route: e.route });
  }

  canFetchChildren(content: GroupInfo): boolean {
    return !content.route.isUser;
  }

  fetchNavData(route: ContentRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return this.groupNavigationService.getGroupNavigation(route.id).pipe(
      map(data => this.mapNavData(data, route.path))
    );
  }

  isOfContentType(content: ContentInfo|null): content is GroupInfo {
    return isGroupInfo(content);
  }

  addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: GroupInfo): NavTreeElement {
    return contentInfo.title ? { ...treeElement, title: contentInfo.title } : treeElement;
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
      groupRelation: { isMember: child.currentUserMembership !== 'none', managership: child.currentUserManagership }
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
