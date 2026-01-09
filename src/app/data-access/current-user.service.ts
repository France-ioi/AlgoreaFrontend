import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { assertSuccess, SimpleActionResponse } from './action-response';
import { map } from 'rxjs/operators';

const currentUserSchema = z.object({
  groupId: z.string(),
  login: z.string(),
  profile: z.object({
    firstName: z.string().nullable().catch(null),
    lastName: z.string().nullable().catch(null),
    birthDate: z.string().nullable().catch(null),
    studentId: z.string().nullable().catch(null),
    sex: z.string().nullable().catch(null),
    countryCode: z.string().catch(''),
    webSite: z.string().nullable().catch(null),
    grade: z.number().nullable().catch(null),
    graduationYear: z.number().catch(-1),
    email: z.string().nullable().catch(null),
    address: z.string().nullable().catch(null),
    city: z.string().nullable().catch(null),
    zipCode: z.string().nullable().catch(null),
    cellPhoneNumber: z.string().nullable().catch(null),
    timeZone: z.string().nullable().catch(null),
  }).partial().nullable(),
  defaultLanguage: z.string(),
  tempUser: z.boolean()
});

export type CurrentUserProfile = z.infer<typeof currentUserSchema>;

export interface UpdateUserBody {
  default_language: string,
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserHttpService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<CurrentUserProfile> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/current-user`)
      .pipe(
        decodeSnakeCase(currentUserSchema)
      );
  }

  update(changes: UpdateUserBody): Observable<void> {
    return this.http.put<SimpleActionResponse>(`${this.config.apiUrl}/current-user`, changes)
      .pipe(
        map(assertSuccess)
      );
  }

  refresh(): Observable<void> {
    return this.http.put<SimpleActionResponse>(`${this.config.apiUrl}/current-user/refresh`, null)
      .pipe(
        map(assertSuccess)
      );
  }

}
