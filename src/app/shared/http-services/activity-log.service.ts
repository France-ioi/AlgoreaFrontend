import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../helpers/config';

interface RawActivityLog {
  activity_type: 'result_started'|'submission'|'result_validated',
  answer_id?: string,
  at: string,
  attempt_id: string,
  from_answer_id: string,
  item: {
    id: string,
    string: {
      title: string,
    },
    type: 'Chapter'|'Task'|'Course'|'Skill',
  },
  participant: {
    id: string,
    name: string,
    type: 'Team'|'User',
  },
  score?: number,
  user?: {
    id: string,
    first_name: string|null,
    last_name: string|null,
    login: string,
  },
}

export interface ActivityLog {
  activity_type: 'result_started'|'submission'|'result_validated',
  at: Date,
  item: {
    id: string,
    string: {
      title: string,
    },
    type: 'Chapter'|'Task'|'Course'|'Skill',
  },
  participant: {
    id: string,
    name: string,
    type: 'Team'|'User',
  },
  score?: number,
  user?: {
    id: string,
    first_name: string|null,
    last_name: string|null,
    login: string,
  },
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  constructor(private http: HttpClient) { }

  getActivityLog(
    itemId: string,
  ): Observable<ActivityLog[]> {
    let params = new HttpParams();
    params = params.set('limit', '20');
    return this.http
      .get<RawActivityLog[]>(`${appConfig.apiUrl}/items/${itemId}/log`, { params: params })
      .pipe(
        map(data => data.map(d => ({
          at: new Date(d.at),
          activity_type: d.activity_type,
          item: d.item,
          participant: d.participant,
          score: d.score,
          user: d.user,
        })))
      );
  }
}
