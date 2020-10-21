import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ItemPermissionsInfo } from '../helpers/item-permissions';
import { Result } from './get-results.service';

export interface ItemChild extends ItemPermissionsInfo{
  id: string,
  best_score: number,
  string: {
    title: string|null,
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
  type: 'Chapter'|'Task'|'Course'|'Skill',
  results: Result[],
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
      .get<ItemChild[]>(`${environment.apiUrl}/items/${id}/children`, { params: params });
  }
}
