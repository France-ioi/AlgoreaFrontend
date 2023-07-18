import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../../shared/helpers/decoders';
import { pipe } from 'fp-ts/function';
import { Observable } from 'rxjs';

const threadDecoder = pipe(
  D.struct({
    item: D.struct({
      id: D.string,
      languageTag: D.string,
      title: D.string,
      type: D.literal('Chapter','Task','Skill'),
    }),
    latestUpdateAt: dateDecoder,
    messageCount: D.number,
    participant: pipe(
      D.struct({
        id: D.string,
        login: D.string,
      }),
      D.intersect(
        D.partial({
          firstName: D.string,
          lastName: D.string,
        }),
      ),
    ),
    status: D.literal('not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed'),
  }),
);

export type Thread = D.TypeOf<typeof threadDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetThreadsService {
  constructor(private http: HttpClient) {
  }

  get(payload: { itemId: string, isMine: boolean } | { itemId: string, watchedGroupId: string }): Observable<Thread[]> {
    let params = new HttpParams({ fromObject: { item_id: payload.itemId } });
    if ('isMine' in payload) {
      params = params.set('is_mine', payload.isMine ? 1 : 0);
    }
    if ('watchedGroupId' in payload) {
      params = params.set('watched_group_id', payload.watchedGroupId);
    }
    return this.http.get<unknown>(`${appConfig.apiUrl}/threads`, {
      params,
    }).pipe(
      decodeSnakeCase(D.array(threadDecoder)),
    );
  }
}
