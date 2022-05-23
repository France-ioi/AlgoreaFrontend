import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { assertSuccess, SimpleActionResponse } from './action-response';
import { map } from 'rxjs/operators';

export const currentUserDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
    firstName: D.nullable(D.string),
    lastName: D.nullable(D.string),
    birthDate: D.nullable(D.string),
    studentId: D.nullable(D.string),
    sex: D.nullable(D.string),
    countryCode: D.string,
    webSite: D.nullable(D.string),
    grade: D.nullable(D.number),
    graduationYear: D.number,
    email: D.nullable(D.string),
    defaultLanguage: D.string,
    address: D.nullable(D.string),
    city: D.nullable(D.string),
    zipCode: D.nullable(D.string),
    cellPhoneNumber: D.nullable(D.string),
    timeZone: D.nullable(D.string),
    tempUser: D.boolean
  })
);

export type UserProfile = D.TypeOf<typeof currentUserDecoder>;

export interface UpdateUserBody {
  default_language: string,
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserHttpService {

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<UserProfile> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user`)
      .pipe(
        decodeSnakeCase(currentUserDecoder)
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
