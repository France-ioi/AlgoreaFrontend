import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { z } from 'zod/v4';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';

const profileEditTokenSchema = z.object({
  alg: z.string(),
  token: z.string(),
});

export type ProfileEditToken = z.infer<typeof profileEditTokenSchema>;

@Injectable({
  providedIn: 'root'
})
export class GenerateProfileEditTokenService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  generate(id: string): Observable<ProfileEditToken> {
    return this.http.post<unknown>(`${this.config.apiUrl}/users/${id}/generate-profile-edit-token`, undefined).pipe(
      decodeSnakeCase(profileEditTokenSchema),
    );
  }
}
