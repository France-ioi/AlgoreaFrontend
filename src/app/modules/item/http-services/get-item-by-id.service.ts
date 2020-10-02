import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Item {
  id: string,
  requires_explicit_entry: boolean
  string: {
    title: string|null,
    subtitle: string|null,
  },
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  },
}

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Item> {
    return this.http
      .get<Item>(`${environment.apiUrl}/items/${id}`);
  }

}
