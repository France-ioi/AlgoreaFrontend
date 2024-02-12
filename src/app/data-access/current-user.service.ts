import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../utils/config';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { assertSuccess, SimpleActionResponse } from './action-response';
import { map } from 'rxjs/operators';

const currentUserSchema = z.object({
  groupId: z.string(),
  login: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  birthDate: z.string().nullable(),
  studentId: z.string().nullable(),
  sex: z.string().nullable(),
  countryCode: z.string(),
  webSite: z.string().nullable(),
  grade: z.number().nullable(),
  graduationYear: z.number(),
  email: z.string().nullable(),
  defaultLanguage: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  zipCode: z.string().nullable(),
  cellPhoneNumber: z.string().nullable(),
  timeZone: z.string().nullable(),
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

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<CurrentUserProfile> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user`)
      .pipe(
        decodeSnakeCaseZod(currentUserSchema)
      );
  }

  update(changes: UpdateUserBody): Observable<void> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/current-user`, changes)
      .pipe(
        map(assertSuccess)
      );
  }

  refresh(): Observable<void> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/current-user/refresh`, null)
      .pipe(
        map(assertSuccess)
      );
  }

}
