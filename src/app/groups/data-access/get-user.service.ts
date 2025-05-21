import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { User, userDecoder } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class GetUserService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  getForId(id: string): Observable<User> {
    return this.http.get<unknown>(`${this.config.apiUrl}/users/${ id }`)
      .pipe(
        decodeSnakeCase(userDecoder)
      );
  }
}
