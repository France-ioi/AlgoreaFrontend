import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { APPCONFIG } from 'src/app/config';

const identityTokenResponseSchema = z.object({
  expiresIn: z.number(),
  identityToken: z.string(),
});
export type IdentityTokenResponse = z.infer<typeof identityTokenResponseSchema>;

@Injectable({
  providedIn: 'root',
})
export class IdentityTokenService {
  private config = inject(APPCONFIG);

  constructor(
    private http: HttpClient,
  ) {}

  generate(): Observable<IdentityTokenResponse> {
    return this.http
      .post<ActionResponse<unknown>>(`${this.config.apiUrl}/auth/identity-token`, undefined).pipe(
        map(successData),
        decodeSnakeCase(identityTokenResponseSchema)
      );
  }

}
