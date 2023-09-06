import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import jwtDecode from 'jwt-decode';

const threadDecoder = D.struct({
  // itemId: D.string, -> bug in backend
  // participantId: D.string, -> bug in backend
  status: D.literal('not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed'),
  token: D.string,
});

type Thread = D.TypeOf<typeof threadDecoder>;

const threadTokenDecoder = D.struct({
  itemId: D.string,
  participantId: D.string,
  userId: D.string,
  isMine: D.boolean,
  canWatch: D.boolean,
  canWrite: D.boolean,
});
type ThreadToken = D.TypeOf<typeof threadTokenDecoder>;

export type ThreadInfo = Thread & ThreadToken;

@Injectable({
  providedIn: 'root',
})
export class ThreadService {

  constructor(private http: HttpClient) {}

  get(itemId: string, participantId: string): Observable<ThreadInfo> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${itemId}/participant/${participantId}/thread`).pipe(
      decodeSnakeCase(threadDecoder),
      switchMap(thread => of(jwtDecode(thread.token, { header: false })).pipe(
        decodeSnakeCase(threadTokenDecoder),
        map(token => ({ ...thread, ...token }))
      ))
    );
  }

}
