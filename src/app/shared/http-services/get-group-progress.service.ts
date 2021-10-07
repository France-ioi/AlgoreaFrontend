import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from '../helpers/decoders';

const groupProgressDecoder = pipe(
  D.struct({
    averageScore: D.number,
    avgHintsRequested: D.number,
    avgSubmissions: D.number,
    avgTimeSpent: D.number,
    groupId: D.string,
    itemId: D.string,
    validationRate: D.number,
  })
);

export type GroupProgress = D.TypeOf<typeof groupProgressDecoder>;

const teamUserProgressDecoder = pipe(
  D.struct({
    groupId: D.string,
    hintsRequested: D.number,
    itemId: D.string,
    latestActivityAt: D.nullable(dateDecoder),
    score: D.number,
    submissions: D.number,
    timeSpent: D.number,
    validated: D.boolean,
  })
);

export type TeamUserProgress = D.TypeOf<typeof teamUserProgressDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupProgressService {

  constructor(private http: HttpClient) { }

  getUsersProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<TeamUserProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/user-progress`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(teamUserProgressDecoder)),
      );
  }

  getTeamsProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<TeamUserProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/team-progress`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(teamUserProgressDecoder)),
      );
  }

  getGroupsProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<GroupProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/group-progress`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(groupProgressDecoder)),
      );
  }
}
