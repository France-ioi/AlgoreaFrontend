import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../../shared/helpers/decoders';
import { decodeSnakeCase } from '../../../shared/operators/decode';

const userDecoder = pipe(
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
    memberSince: D.nullable(dateDecoder),
    action: D.literal('invitation_accepted', 'join_request_accepted', 'joined_by_code', 'added_directly'),
    user: D.nullable(userDecoder),
  })
);

export type Member = D.TypeOf<typeof memberDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupMembersService {

  constructor(private http: HttpClient) { }

  getGroupMembers(
    groupId: string,
    sort: string[] = []
  ): Observable<Member[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/members`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(memberDecoder)),
      );
  }
}
