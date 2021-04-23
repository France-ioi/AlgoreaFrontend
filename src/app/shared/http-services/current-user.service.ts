import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/lib/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

export const currentUserDecoder = pipe(
  D.struct({
    id: D.string,
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
    isTemp: D.boolean
  })
);

export type UserProfile = D.TypeOf<typeof currentUserDecoder>;

interface RawUserProfile {
  group_id: string,
  temp_user: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserHttpService {

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<UserProfile> {
    return this.http
      .get<RawUserProfile>(`${appConfig().apiUrl}/current-user`)
      .pipe(
        map(raw => ({
          ...raw,
          id: raw.group_id,
          isTemp: raw.temp_user,
        })),
        decodeSnakeCase(currentUserDecoder)
      );
  }

}
