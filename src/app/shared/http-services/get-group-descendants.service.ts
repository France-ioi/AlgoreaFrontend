import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { userDecoder as memberDecoder } from 'src/app/modules/group/http-services/get-group-members.service';

const descendantParentDecoder = D.struct({
  id: D.string,
  name: D.string,
});

const teamDescendantDecoder = pipe(
  D.struct({
    grade: D.number,
    id: D.string,
    members: D.array(memberDecoder),
    name: D.string,
    parents: D.array(descendantParentDecoder),
  }),
);

export type TeamDescendants = D.TypeOf<typeof teamDescendantDecoder>;

const userDecoder = pipe(
  D.struct({
    grade: D.nullable(D.number),
    login: D.string,
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
    })
  )
);

const userDescendantDecoder = pipe(
  D.struct({
    id: D.string,
    name: D.string,
    parents: D.array(descendantParentDecoder),
    user: userDecoder,
  }),
);

export type UserDescendant = D.TypeOf<typeof userDescendantDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupDescendantsService {

  constructor(private http: HttpClient) { }

  getUserDescendants(groupId: string, options: { sort?: string[], limit?: number, fromId?: string }): Observable<UserDescendant[]> {
    let params = new HttpParams();
    if (options.sort && options.sort.length > 0) params = params.set('sort', options.sort.join(','));
    if (options.limit !== undefined) params = params.set('limit', options.limit);
    if (options.fromId !== undefined) params = params.set('from.id', options.fromId);
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/user-descendants`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(userDescendantDecoder)),
      );
  }

  getTeamDescendants(
    groupId: string,
    sort: string[] = [],
  ): Observable<TeamDescendants[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/team-descendants`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(teamDescendantDecoder)),
      );
  }
}
