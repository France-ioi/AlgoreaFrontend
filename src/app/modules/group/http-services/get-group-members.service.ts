import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../../shared/helpers/decoders';
import { decodeSnakeCase } from '../../../shared/operators/decode';

export const userDecoder = pipe(
  D.struct({
    grade: D.nullable(D.number),
    groupId: D.string,
    login: D.string,
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
    }),
  ),
);

const memberDecoder = pipe(
  D.struct({
    id: D.string,
    user: userDecoder,
  }),
  D.intersect(
    D.partial({
      action: D.literal('invitation_accepted', 'join_request_accepted', 'joined_by_code', 'joined_by_badge', 'added_directly'),
      memberSince: dateDecoder,
    })
  )
);

export type Member = D.TypeOf<typeof memberDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupMembersService {

  constructor(private http: HttpClient) { }

  getGroupMembers(
    groupId: string,
    sort: string[] = [],
    limit?: number,
    fromId?: string,
  ): Observable<Member[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (limit !== undefined) params = params.set('limit', limit.toString());
    if (fromId !== undefined) params = params.set('from.id', fromId);
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/members`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(memberDecoder)),
      );
  }
}
