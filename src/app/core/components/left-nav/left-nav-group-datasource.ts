import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupInfo } from 'src/app/shared/services/current-content.service';
import { GroupNavigationService, NavMenuGroup } from '../../http-services/group-navigation.service';
import { LeftNavDataSource } from './left-nav-datasource';

export class LeftNavGroupDataSource extends LeftNavDataSource<GroupInfo, NavMenuGroup> {

  constructor(
    private groupNavigationService: GroupNavigationService,
  ) {
    super();
  }

  addDetailsToTreeElement(contentInfo: GroupInfo, treeElement: NavMenuGroup): NavMenuGroup {
    return contentInfo.title ? { ...treeElement, title: contentInfo.title } : { ...treeElement };
  }

  fetchRootTreeData(): Observable<NavMenuGroup[]> {
    return this.groupNavigationService.getRoot().pipe(
      map(root => root.groups)
    );
  }

  fetchNavDataFromChild(id: string, _child: GroupInfo): Observable<{ parent: NavMenuGroup, elements: NavMenuGroup[] }> {
    return this.groupNavigationService.getNavData(id).pipe(
      map(data => ({ parent: data.parent, elements: data.groups }))
    );
  }

  fetchNavData(el: NavMenuGroup): Observable<{ parent: NavMenuGroup, elements: NavMenuGroup[] }> {
    return this.groupNavigationService.getNavData(el.id).pipe(
      map(data => ({ parent: data.parent, elements: data.groups }))
    );
  }


}
