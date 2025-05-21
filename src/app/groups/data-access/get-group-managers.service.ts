import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from '../../utils/operators/decode';

export const managerDecoder = pipe(
  D.struct({
    id: D.string,
    name: D.string,
    canManage: D.literal('none', 'memberships', 'memberships_and_group'),
    canGrantGroupAccess: D.boolean,
    canWatchMembers: D.boolean,
  }),
  D.intersect(
    D.partial({
      login: D.string,
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
    }),
  )
);

export type Manager = D.TypeOf<typeof managerDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupManagersService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  getGroupManagers(
    groupId: string,
    options?: {
      sort?: string[],
      limit?: number,
      fromId?: string,
    },
  ): Observable<Manager[]> {
    let params = new HttpParams();
    if (options?.sort) params = params.set('sort', options.sort.join(','));
    if (options?.limit !== undefined) params = params.set('limit', options.limit);
    if (options?.fromId !== undefined) params = params.set('from.id', options.fromId);

    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/${groupId}/managers`, { params: params }).pipe(
        decodeSnakeCase(D.array(managerDecoder)),
      );
  }
}
