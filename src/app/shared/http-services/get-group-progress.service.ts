import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export interface Progress {
  groupId: string,
  itemId: string,
  validated: boolean,
  score: number,
  timeSpent: number,
}

interface RawGroupProgress {
  group_id: string,
  item_id: string,
  average_score: number,
  avg_hints_requested: number,
  avg_submissions: number,
  avg_time_spent: number,
  validation_rate: number,
}

export interface GroupProgress {
  groupId: string,
  itemId: string,
  averageScore: number,
  avgHintsRequested: number,
  avgSubmissions: number,
  avgTimeSpent: number,
  validationRate: number,
}

interface RawTeamUserProgress {
  group_id: string,
  item_id: string,
  hints_requested: number,
  latest_activity_at: string|null,
  score: number,
  submissions: number,
  time_spent: number,
  validated: boolean,
}

export interface TeamUserProgress extends Progress{
  hintsRequested: number,
  latestActivityAt: Date|null,
  submissions: number,
}

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
      .get<RawTeamUserProgress[]>(`${appConfig().apiUrl}/groups/${groupId}/user-progress`, { params: params })
      .pipe(
        map(rawGroupUsersProgress => rawGroupUsersProgress.map(m => ({
          groupId: m.group_id,
          itemId: m.item_id,
          hintsRequested: m.hints_requested,
          latestActivityAt: m.latest_activity_at === null ? null : new Date(m.latest_activity_at),
          score: m.score,
          submissions: m.submissions,
          timeSpent: m.time_spent,
          validated: m.validated,
        })))
      );
  }

  getTeamsProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<TeamUserProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<RawTeamUserProgress[]>(`${appConfig().apiUrl}/groups/${groupId}/team-progress`, { params: params })
      .pipe(
        map(rawGroupTeamsProgress => rawGroupTeamsProgress.map(m => ({
          groupId: m.group_id,
          itemId: m.item_id,
          hintsRequested: m.hints_requested,
          latestActivityAt: m.latest_activity_at === null ? null : new Date(m.latest_activity_at),
          score: m.score,
          submissions: m.submissions,
          timeSpent: m.time_spent,
          validated: m.validated,
        })))
      );
  }

  getGroupsProgress(
    groupId: string,
    parentItemIds: string[],
  ): Observable<GroupProgress[]> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get<RawGroupProgress[]>(`${appConfig().apiUrl}/groups/${groupId}/group-progress`, { params: params })
      .pipe(
        map(rawGroupsProgress => rawGroupsProgress.map(m => ({
          groupId: m.group_id,
          itemId: m.item_id,
          averageScore: m.average_score,
          avgHintsRequested: m.avg_hints_requested,
          avgSubmissions: m.avg_submissions,
          avgTimeSpent: m.avg_time_spent,
          validationRate: m.validation_rate,
        })))
      );
  }
}
