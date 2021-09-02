import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { appConfig } from 'src/app/shared/helpers/config';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const groupNavigationChildDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
  currentUserManagership: D.literal('none', 'direct', 'ancestor', 'descendant'),
  currentUserMembership: D.literal('none', 'direct', 'descendant'),
});

type GroupNavigationChild = D.TypeOf<typeof groupNavigationChildDecoder>;

const groupNavigationDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
  children: D.array(groupNavigationChildDecoder),
});

export type GroupNavigation = D.TypeOf<typeof groupNavigationDecoder>;

interface RawRootGroups {
  id: string,
  name: string,
  type: 'Class' | 'Team' | 'Club' | 'Friends' | 'Other' | 'User' | 'Session' | 'Base',
  current_user_managership: 'none' | 'direct' | 'ancestor' | 'descendant',
  current_user_membership: 'none' | 'direct' | 'descendant',
}

type BaseGroupData = Pick<GroupNavigation, 'id' | 'name' | 'type'>;
type WithNavigationData<T extends BaseGroupData> = Omit<T, 'name'> & {
  title: BaseGroupData['name'];
  hasChildren: boolean;
  locked: boolean;
};

type GroupNavigationParent = Omit<GroupNavigation, 'children'>;

export type NavMenuParentGroup = WithNavigationData<GroupNavigationParent>;
export type NavMenuChildGroup = WithNavigationData<GroupNavigationChild>;
export type NavMenuGroup = NavMenuParentGroup | NavMenuChildGroup;

export interface NavMenuRootGroup {
  parent: NavMenuParentGroup,
  groups: NavMenuChildGroup[],
}

export interface NavMenuRootGroupWithoutParent {
  groups: NavMenuChildGroup[],
}




@Injectable({
  providedIn: 'root'
})
export class GroupNavigationService {

  constructor(private http: HttpClient) {}

  getGroupNavigation(groupId: string): Observable<GroupNavigation> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/navigation`).pipe(
      decodeSnakeCase(groupNavigationDecoder),
    );
  }

  getNavData(groupId: string): Observable<NavMenuRootGroup> {
    return this.getGroupNavigation(groupId).pipe(
      map(data => ({
        parent: {
          id: data.id,
          title: data.name,
          type: data.type,
          hasChildren: data.children.length > 0,
          locked: false,
        },
        groups: data.children.map(({ name, ...child }) => ({
          ...child,
          title: name,
          hasChildren: child.type !== 'User', // maybe should be fetched from backend
          locked: false,
        })),
      }))
    );
  }

  getRoot(): Observable<NavMenuRootGroupWithoutParent> {
    return this.http
      .get<RawRootGroups[]>(`${appConfig.apiUrl}/groups/roots`)
      .pipe(
        map(g => ({
          groups: g.map(group => ({
            id: group.id,
            title: group.name,
            type: group.type,
            currentUserManagership: group.current_user_managership,
            currentUserMembership: group.current_user_membership,
            hasChildren: group.type !== 'User', // maybe should be fetched from backend (?)
            locked: false,
          }))
        }))
      );
  }

}
