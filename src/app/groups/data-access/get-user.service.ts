import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../utils/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../utils/operators/decode';

export const userDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
    tempUser: D.boolean,
    webSite: D.nullable(D.string),
    freeText: D.nullable(D.string),
    isCurrentUser: D.boolean,
    ancestorsCurrentUserIsManagerOf: D.array(D.struct({
      id: D.string,
      name: D.string,
    })),
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
      currentUserCanWatchUser: D.boolean,
      currentUserCanGrantUserAccess: D.boolean,
    }),
  ),
);

export type User = D.TypeOf<typeof userDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetUserService {
  constructor(private http: HttpClient) {
  }

  getForId(id: string): Observable<User> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/users/${ id }`)
      .pipe(
        decodeSnakeCase(userDecoder)
      );
  }
}
