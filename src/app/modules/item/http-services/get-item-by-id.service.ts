import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder, durationDecoder } from 'src/app/shared/helpers/decoders';
import { itemCanRequestHelpDecoder, itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';

export const itemDecoder = pipe(
  D.struct({
    id: D.string,
    requiresExplicitEntry: D.boolean,
    string: pipe(
      D.struct({
        title: D.nullable(D.string),
        languageTag: D.string,
        imageUrl: D.nullable(D.string),
      }),
      D.intersect(
        D.partial({
          subtitle: D.nullable(D.string),
          description: D.nullable(D.string),
        })
      )
    ),
    bestScore: D.number,
    permissions: pipe(itemCorePermDecoder, D.intersect(itemCanRequestHelpDecoder)),
    type: D.literal('Chapter','Task','Skill'),
    promptToJoinGroupByCode: D.boolean,
    textId: D.nullable(D.string),
    validationType: D.literal('None','All','AllButOne','Categories','One','Manual'),
    noScore: D.boolean,
    titleBarVisible: D.boolean,
    fullScreen: D.literal('forceYes','forceNo','default'),
    childrenLayout: D.literal('List', 'Grid'),
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
      watchedGroup: D.partial({
        averageScore: D.number,
        permissions: itemCorePermDecoder,
      }),
    })
  )
);

export type Item = D.TypeOf<typeof itemDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  constructor(private http: HttpClient) {}

  get(id: string, watchedGroupId?: string): Observable<Item> {
    let params = new HttpParams();
    if (watchedGroupId) {
      params = params.set('watched_group_id', watchedGroupId);
    }
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${id}`, { params }).pipe(
      decodeSnakeCase(itemDecoder),
    );
  }

}
