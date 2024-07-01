import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';

const profileEditTokenSchema = z.object({
  alg: z.string(),
  token: z.string(),
});

export type ProfileEditToken = z.infer<typeof profileEditTokenSchema>;

@Injectable({
  providedIn: 'root'
})
export class GenerateProfileEditTokenService {
  constructor(private http: HttpClient) {}

  generate(id: string): Observable<ProfileEditToken> {
    return this.http.post<unknown>(`${appConfig.apiUrl}/users/${id}/generate-profile-edit-token`, undefined).pipe(
      decodeSnakeCaseZod(profileEditTokenSchema),
    );
  }
}
