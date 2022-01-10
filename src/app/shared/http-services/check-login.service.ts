import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { appConfig } from '../helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { delay, map } from 'rxjs/operators';

const fakePassingId = 42;

const dataDecoder = D.struct({
  loginIdMatched: D.boolean,
});

@Injectable({
  providedIn: 'root'
})
export class CheckLoginService {

  constructor(private http: HttpClient) {}

  check(loginId: number): Observable<boolean> {
    if (loginId === fakePassingId) return of(true).pipe(delay(300));

    const params = new HttpParams({ fromObject: { login_id: loginId } });

    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user/check-login-id`, { params })
      .pipe(
        decodeSnakeCase(dataDecoder),
        map(data => data.loginIdMatched),
      );
  }

}
