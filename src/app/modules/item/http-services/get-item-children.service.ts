import { HttpClient } from '@angular/common/http';
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

  get(id: number): Observable<ItemChild[]> {
    return this.http
      .get<ItemChild[]>(`${environment.apiUrl}/items/${id}/children`);
  }
}
