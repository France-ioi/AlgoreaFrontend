import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { Group, groupSchema } from '../models/group';

@Injectable({
  providedIn: 'root',
})
export class GetGroupByIdService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  get(id: string): Observable<Group> {
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${id}`).pipe(
      decodeSnakeCase(groupSchema),
    );
  }

}
