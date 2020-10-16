import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ItemChild {
  string: {
    title: string|null,
  },
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  },
  category: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge',
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
