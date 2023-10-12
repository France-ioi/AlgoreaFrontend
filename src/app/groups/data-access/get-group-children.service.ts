import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, map, forkJoin, of } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { manageTypeDecoder } from 'src/app/data-access/managed-groups.service';
import { decodeSnakeCase } from '../../utils/operators/decode';

const typeDecoder = D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User','Session', 'Base');

const groupChildDecoder = pipe(
  D.struct({
    currentUserIsManager: D.boolean,
    grade: D.number,
    id: D.string,
    isOpen: D.boolean,
    isPublic: D.boolean,
    name: D.string,
    type: typeDecoder,
  }),
  D.intersect(
    D.partial({
      currentUserCanGrantGroupAccess: D.boolean,
      currentUserCanManage: manageTypeDecoder,
      currentUserCanWatchMembers: D.boolean,
      userCount: D.number,
    })
  )
);

export type GroupChild = D.TypeOf<typeof groupChildDecoder>;
export type GroupType = D.TypeOf<typeof typeDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupChildrenService {

  constructor(private http: HttpClient) { }

  getGroupChildren(
    groupId: string,
    sort: string[] = [],
    typesInclude: GroupType[] = [],
    typesExclude: GroupType[] = [],
  ): Observable<GroupChild[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (typesInclude.length > 0) params = params.set('types_include', typesInclude.join(','));
    if (typesExclude.length > 0) params = params.set('types_exclude', typesExclude.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/children`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(groupChildDecoder))
      );
  }

  getGroupChildrenWithSubgroupCount(
    groupId: string,
    sort: string[] = [],
    typesInclude: GroupType[] = [],
    typesExclude: GroupType[] = [],
  ): Observable<(GroupChild & { isEmpty: boolean })[]> {
    return this.getGroupChildren(groupId, sort, typesInclude, typesExclude).pipe(
      switchMap(groupChildren => {
        if (groupChildren.length === 0) {
          return of([]);
        }
        return forkJoin(
          groupChildren.map(g =>
            this.getGroupChildren(g.id).pipe(
              map(subGroupChildren => ({
                ...g,
                isEmpty: subGroupChildren.length === 0,
              })),
            )
          )
        );
      }),
    );
  }
}
