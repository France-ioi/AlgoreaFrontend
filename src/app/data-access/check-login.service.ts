import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { map } from 'rxjs/operators';

const responseSchema = z.object({
  loginIdMatched: z.boolean()
});

@Injectable({
  providedIn: 'root'
})
export class CheckLoginService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  check(loginId: string): Observable<boolean> {
    const params = new HttpParams({ fromObject: { login_id: loginId } });

    return this.http
      .get<unknown>(`${this.config.apiUrl}/current-user/check-login-id`, { params })
      .pipe(
        decodeSnakeCase(responseSchema),
        map(data => data.loginIdMatched),
      );
  }

}
