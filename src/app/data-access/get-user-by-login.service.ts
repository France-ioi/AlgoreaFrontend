import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { decodeSnakeCaseZod } from '../utils/operators/decode';
import { HttpClient } from '@angular/common/http';
import { User, userSchema } from '../groups/models/user';

@Injectable({
  providedIn: 'root'
})
export class GetUserByLoginService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  get(login: string): Observable<User> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/users/by-login/${login}`)
      .pipe(decodeSnakeCaseZod(userSchema));
  }
}
