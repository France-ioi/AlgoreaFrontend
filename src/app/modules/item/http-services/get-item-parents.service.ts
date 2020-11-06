import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemPermissionsInfo } from '../helpers/item-permissions';

interface RawItemParent extends ItemPermissionsInfo {
  id: string,
  best_score: number,
  string: {
    title: string|null,
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
  type: 'Chapter'|'Task'|'Course'|'Skill',
  result: {
    attempt_id: string,
    latest_activity_at: string,
    started_at: string|null,
    score_computed: number,
    validated: boolean,
  },
}

export interface ItemParent extends ItemPermissionsInfo {
  id: string,
  bestScore: number,
  string: {
    title: string|null,
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
  type: 'Chapter'|'Task'|'Course'|'Skill',
  result: {
    attempt_id: string,
    latestActivityAt: Date,
    startedAt: Date|null,
    score: number,
    validated: boolean,
  },
}


@Injectable({
  providedIn: 'root'
})
export class GetItemParentsService {

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemParent[]> {
    // eslint-disable-next-line no-console
    console.log('call');

    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<RawItemParent[]>(`${appConfig().apiUrl}/items/${id}/parents`, { params: params })
      .pipe(
        map(parents => parents.map(p => ({
          id: p.id,
          bestScore: p.best_score,
          string: p.string,
          category: p.category,
          type: p.type,
          result: {
            attempt_id: p.result.attempt_id,
            latestActivityAt: new Date(p.result.latest_activity_at),
            startedAt: p.result.started_at === null ? null : new Date(p.result.started_at),
            score: p.result.score_computed,
            validated: p.result.validated,
          },
          permissions: p.permissions,
        })))
      );
  }
}
