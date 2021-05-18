import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { permissionsDecoder } from '../helpers/item-permissions';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const itemParentDecoder = D.struct({
  id: D.string,
  bestScore: D.number,
  string: D.struct({
    title: D.nullable(D.string),
  }),
  category: D.literal('Undefined', 'Discovery', 'Application', 'Validation', 'Challenge'),
  type: D.literal('Chapter','Task','Course','Skill'),
  permissions: permissionsDecoder,
  result: D.struct({
    attemptId: D.string,
    latestActivityAt: dateDecoder,
    startedAt: D.nullable(dateDecoder),
    scoreComputed: D.number,
    validated: D.boolean,
  })
});

export type ItemParent = D.TypeOf<typeof itemParentDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetItemParentsService {

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemParent[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/parents`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(itemParentDecoder))
      );
  }
}
