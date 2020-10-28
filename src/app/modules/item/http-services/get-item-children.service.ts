import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ItemPermissionsInfo } from '../helpers/item-permissions';

interface RawItemChild extends ItemPermissionsInfo {
  id: string,
  best_score: number,
  string: {
    title: string|null,
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
  type: 'Chapter'|'Task'|'Course'|'Skill',
  results: {
    attempt_id: string,
    latest_activity_at: string,
    started_at: string|null,
    score_computed: number,
    validated: boolean,
  }[],
}

export interface ItemChild extends ItemPermissionsInfo {
  id: string,
  bestScore: number,
  string: {
    title: string|null,
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
  type: 'Chapter'|'Task'|'Course'|'Skill',
  results: {
    attempt_id: string,
    latestActivityAt: Date,
    startedAt: Date|null,
    score: number,
    validated: boolean,
  }[],
}


@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {

  constructor(private http: HttpClient) { }

  get(id: string, attempt_id: string
    ): Observable<ItemChild[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attempt_id);
    return this.http
      .get<RawItemChild[]>(`${environment.apiUrl}/items/${id}/children`, { params: params })
      .pipe(
        map(children => children.map(c => ({
          id: c.id,
          bestScore: c.best_score,
          string: c.string,
          category: c.category,
          type: c.type,
          results: c.results.map(r => ({
            attempt_id: r.attempt_id,
            latestActivityAt: new Date(r.latest_activity_at),
            startedAt: r.started_at === null ? null : new Date(r.started_at),
            score: r.score_computed,
            validated: r.validated,
          })),
          permissions: c.permissions,
        })))
      );
  }
}
