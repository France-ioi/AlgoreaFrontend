import { Injectable } from '@angular/core';
import { of, Observable, OperatorFunction, pipe } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { GroupInfo, isGroupInfo } from 'src/app/shared/models/content/group-info';
import { groupRoute } from 'src/app/shared/routing/group-route';
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

  childrenNavData(): OperatorFunction<GroupInfo|undefined,NavTreeElement[]|Error> {
    return pipe(
      distinctUntilChanged((g1, g2) => g1?.route.id === g2?.route.id),
      repeatLatestWhen(this.reload$),
      switchMap(group => {
        if (!group || group.route.isUser) return of([]);
        return this.groupNavigationService.getGroupNavigation(group.route.id).pipe(
          map(data => this.mapNavData(data).elements),
          catchError(() => of(new Error('group nav fetch error'))),
        );
      }),
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
      groupRelation: { isMember: child.currentUserMembership !== 'none', managership: child.currentUserManagership }
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
