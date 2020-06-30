import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Group {
  id: string;
  name: string;
  description: string;
  current_user_is_manager: boolean;
  current_user_can_manage?: string;
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
