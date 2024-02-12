import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const responseSchema = z.object({
  loginIdMatched: z.boolean()
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
        decodeSnakeCaseZod(responseSchema),
        map(data => data.loginIdMatched),
      );
  }

}
