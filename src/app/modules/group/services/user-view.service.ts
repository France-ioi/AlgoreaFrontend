import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../shared/helpers/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';

export const viewUserDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
    tempUser: D.boolean,
    webSite: D.nullable(D.string),
    freeText: D.nullable(D.string),
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
    })
  )
);

export type UserView = D.TypeOf<typeof viewUserDecoder>;

@Injectable({
  providedIn: 'root'
})
export class UserViewService {
  constructor(private http: HttpClient) {
  }

  getForId(id: string): Observable<UserView> {
    return this.http.get<unknown>(`${appConfig().apiUrl}/users/${ id }`)
      .pipe(
        decodeSnakeCase(viewUserDecoder)
      );
  }
}
