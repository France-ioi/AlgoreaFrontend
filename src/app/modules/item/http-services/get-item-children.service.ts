import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { permissionsDecoder } from '../helpers/item-permissions';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from 'src/app/shared/helpers/decoders';

const baseItemChildDecoder = D.struct({
  id: D.string,
  order: D.number,
  category: D.literal('Undefined', 'Discovery', 'Application', 'Validation', 'Challenge'),
  permissions: permissionsDecoder,
  scoreWeight: D.number,
  contentViewPropagation: D.literal('none', 'as_info', 'as_content'),
  editPropagation: D.boolean,
  grantViewPropagation: D.boolean,
  upperViewLevelsPropagation: D.literal('use_content_view_propagation', 'as_content_with_descendants', 'as_is'),
  watchPropagation: D.boolean,
});

const itemVisibleChildDecoder = D.intersect(baseItemChildDecoder)(
  D.struct({
    bestScore: D.number,
    string: D.struct({
      title: D.nullable(D.string),
    }),
    type: D.literal('Chapter','Task','Course','Skill'),
    results: D.array(D.struct({
      attemptId: D.string,
      latestActivityAt: dateDecoder,
      startedAt: D.nullable(dateDecoder),
      scoreComputed: D.number,
      validated: D.boolean,
    })),
  }),
);

const itemInvisibleChildDecoder = baseItemChildDecoder;

const itemChildDecoder = D.union(
  itemVisibleChildDecoder,
  itemInvisibleChildDecoder,
);

export type ItemVisibleChild = D.TypeOf<typeof itemVisibleChildDecoder>;
export type ItemInvisibleChild = D.TypeOf<typeof itemInvisibleChildDecoder>;
type ItemChild = D.TypeOf<typeof itemChildDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemVisibleChild[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/children`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(itemVisibleChildDecoder))
      );
  }

  getWithInvisibleItems(id: string, attemptId: string): Observable<ItemChild[]> {
    const params = new HttpParams()
      .set('attempt_id', attemptId)
      .set('show_invisible_items', '1');
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/children`, { params })
      .pipe(
        decodeSnakeCase(D.array(itemChildDecoder))
      );
  }
}
