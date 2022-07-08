import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { canCurrentUserViewInfo, ItemWithViewPerm } from 'src/app/shared/models/domain/item-view-permission';
import { itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';

const baseItemChildDecoder = D.struct({
  id: D.string,
  order: D.number,
  category: D.literal('Undefined', 'Discovery', 'Application', 'Validation', 'Challenge'),
  permissions: itemCorePermDecoder,
  scoreWeight: D.number,
  contentViewPropagation: D.literal('none', 'as_info', 'as_content'),
  editPropagation: D.boolean,
  grantViewPropagation: D.boolean,
  upperViewLevelsPropagation: D.literal('use_content_view_propagation', 'as_content_with_descendants', 'as_is'),
  watchPropagation: D.boolean,
});

const itemChildDecoder = D.intersect(baseItemChildDecoder)(
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

const invisibleItemChildDecoder = baseItemChildDecoder;

const possiblyInvisibleItemChild = D.union(
  itemChildDecoder,
  invisibleItemChildDecoder,
);

export type ItemChild = D.TypeOf<typeof itemChildDecoder>;
export type InvisibleItemChild = D.TypeOf<typeof invisibleItemChildDecoder>;
type PossiblyInvisibleItemChild = D.TypeOf<typeof possiblyInvisibleItemChild>;

export function isVisibleItemChild(item: ItemWithViewPerm): item is ItemChild {
  return canCurrentUserViewInfo(item);
}


@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemChild[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/children`, { params: params })
      .pipe(
        decodeSnakeCase(D.array(itemChildDecoder))
      );
  }

  getWithInvisibleItems(id: string, attemptId: string): Observable<PossiblyInvisibleItemChild[]> {
    const params = new HttpParams()
      .set('attempt_id', attemptId)
      .set('show_invisible_items', '1');
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/children`, { params })
      .pipe(
        decodeSnakeCase(D.array(possiblyInvisibleItemChild))
      );
  }
}
