import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { permissionsDecoder } from '../helpers/item-permissions';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from 'src/app/shared/helpers/decoders';

export const itemChildDecoder = D.struct({
  id: D.string,
  bestScore: D.number,
  order: D.number,
  string: D.struct({
    title: D.nullable(D.string),
  }),
  category: D.literal('Undefined', 'Discovery', 'Application', 'Validation', 'Challenge'),
  type: D.literal('Chapter','Task','Course','Skill'),
  permissions: permissionsDecoder,
  results: D.array(D.struct({
    attemptId: D.string,
    latestActivityAt: dateDecoder,
    startedAt: D.nullable(dateDecoder),
    scoreComputed: D.number,
    validated: D.boolean,
  }))
});

export type ItemChild = D.TypeOf<typeof itemChildDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemChild[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<unknown[]>(`${appConfig().apiUrl}/items/${id}/children`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(itemChildDecoder))
      );
  }
}
