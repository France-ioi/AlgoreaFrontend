import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from '../utils/operators/decode';
import { HttpClient } from '@angular/common/http';
import { User, userSchema } from '../groups/models/user';

@Injectable({
  providedIn: 'root'
})
export class GetUserByLoginService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  get(login: string): Observable<User> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/users/by-login/${login}`)
      .pipe(decodeSnakeCase(userSchema));
  }
}
