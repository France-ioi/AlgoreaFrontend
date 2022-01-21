import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../../shared/helpers/config';
import { decodeSnakeCase } from '../../shared/operators/decode';
import { HttpClient } from '@angular/common/http';
import { User, userDecoder } from '../../modules/group/http-services/get-user.service';

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
