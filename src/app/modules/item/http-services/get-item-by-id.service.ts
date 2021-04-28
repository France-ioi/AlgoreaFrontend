import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/lib/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { permissionsDecoder } from '../helpers/item-permissions';
import { dateDecoder, durationDecoder } from 'src/app/shared/helpers/decoders';

export const itemDecoder = pipe(
  D.struct({
    id: D.string,
    requiresExplicitEntry: D.boolean,
    string: pipe(
      D.struct({
        title: D.nullable(D.string),
      }),
      D.intersect(
        D.partial({
          subtitle: D.nullable(D.string),
          description: D.nullable(D.string),
        })
      )
    ),
    bestScore: D.number,
    permissions: permissionsDecoder,
    type: D.literal('Chapter','Task','Course','Skill'),
    promptToJoinGroupByCode: D.boolean,
    textId: D.nullable(D.string),
    validationType: D.literal('None','All','AllButOne','Categories','One','Manual'),
    noScore: D.boolean,
    titleBarVisible: D.boolean,
    fullScreen: D.literal('forceYes','forceNo','default'),
    allowsMultipleAttempts: D.boolean,
    duration: D.nullable(durationDecoder),
    enteringTimeMin: dateDecoder,
    enteringTimeMax: dateDecoder,
    entryParticipantType: D.literal('Team', 'User'),
    entryFrozenTeams: D.boolean,
    entryMaxTeamSize: D.number,
    entryMinAdmittedMembersRatio: D.literal('All', 'Half', 'One', 'None'),
  }),
  D.intersect(
    D.partial({
      url: D.nullable(D.string),
      usesApi: D.nullable(D.boolean),
    })
  )
);

export type Item = D.TypeOf<typeof itemDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Item> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${id}`).pipe(
      decodeSnakeCase(itemDecoder),
    );
  }

}
