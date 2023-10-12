import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const dataDecoder = D.struct({
  loginIdMatched: D.boolean,
});

@Injectable({
  providedIn: 'root'
})
export class CheckLoginService {

  constructor(private http: HttpClient) {}

  check(loginId: string): Observable<boolean> {
    const params = new HttpParams({ fromObject: { login_id: loginId } });

    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user/check-login-id`, { params })
      .pipe(
        decodeSnakeCase(dataDecoder),
        map(data => data.loginIdMatched),
      );
  }

}
