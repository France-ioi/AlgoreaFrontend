import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Group {
  id: string;
  name: string;
  description: string|null;

  current_user_is_manager: boolean;
  current_user_can_manage?: string; /* should be not set (undefined) if not a manager */

  /* the following may be null if no code and undefined if the user is not allowed to see them */
  code?: string|null;
  code_lifetime?: string|null;
  code_expires_at?: string|null;
}

@Injectable({
  providedIn: 'root',
})
export class GetGroupByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Group> {
    return this.http
      .get<Group>(`${environment.apiUrl}/groups/${id}`);
  }

}
