import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../utils/config';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { User, userDecoder } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class GetUserService {
  constructor(private http: HttpClient) {
  }

  getForId(id: string): Observable<User> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/users/${ id }`)
      .pipe(
        decodeSnakeCase(userDecoder)
      );
  }
}
