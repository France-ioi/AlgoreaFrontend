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

type BaseGroupData = Pick<GroupNavigation, 'id' | 'name' | 'type'>;
type WithNavigationData<T extends BaseGroupData> = Omit<T, 'name'> & {
  title: BaseGroupData['name'];
  hasChildren: boolean;
  locked: boolean;
};
function withNavData<T extends BaseGroupData>({ name, ...groupData }: T & { children?: unknown[] }): WithNavigationData<T> {
  return {
    ...groupData,
    title: name,
    hasChildren: groupData.children ? groupData.children.length > 0 : groupData.type !== 'User', // maybe should be fetched from backend
    locked: false,
  };
}

type GroupNavigationParent = Omit<GroupNavigation, 'children'>;

export type NavMenuParentGroup = WithNavigationData<GroupNavigationParent>;
export type NavMenuChildGroup = WithNavigationData<GroupNavigationChild>;
export type NavMenuGroup = NavMenuParentGroup | NavMenuChildGroup;

export interface NavMenuRootGroup {
  parent: NavMenuParentGroup,
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
        parent: withNavData(data),
        groups: data.children.map(withNavData),
      })),
    );
  }

  getRoot(): Observable<NavMenuChildGroup[]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/roots`).pipe(
      decodeSnakeCase(D.array(groupNavigationChildDecoder)),
      map(groups => groups.map(withNavData)),
    );
  }

}
