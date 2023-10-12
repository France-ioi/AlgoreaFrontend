import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import { decodeSnakeCase } from '../utils/operators/decode';
import { HttpClient } from '@angular/common/http';
import { User, userDecoder } from '../groups/data-access/get-user.service';

@Injectable({
  providedIn: 'root'
})
export class GetUserByLoginService {
  constructor(private http: HttpClient) {
  }

  get(login: string): Observable<User> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/users/by-login/${login}`)
      .pipe(decodeSnakeCase(userDecoder));
  }
}
