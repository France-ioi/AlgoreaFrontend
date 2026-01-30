import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../../config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { User, userSchema } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class GetUserService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getForId(id: string): Observable<User> {
    return this.http.get<unknown>(`${this.config.apiUrl}/users/${ id }`)
      .pipe(
        decodeSnakeCase(userSchema)
      );
  }
}
