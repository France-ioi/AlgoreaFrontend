import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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

export type GroupNavigationChild = D.TypeOf<typeof groupNavigationChildDecoder>;

const groupNavigationDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
  children: D.array(groupNavigationChildDecoder),
});

export type GroupNavigationData = D.TypeOf<typeof groupNavigationDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GroupNavigationService {

  constructor(private http: HttpClient) {}

  getGroupNavigation(groupId: string): Observable<GroupNavigationData> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/navigation`).pipe(
      decodeSnakeCase(groupNavigationDecoder),
    );
  }

  getRoot(): Observable<GroupNavigationChild[]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/roots`).pipe(
      decodeSnakeCase(D.array(groupNavigationChildDecoder)),
      // temporary fix: do not list "User" (they should not be listed by the backend!)
      map(children => children.filter(g => g.type !== 'User')),
    );
  }

}
