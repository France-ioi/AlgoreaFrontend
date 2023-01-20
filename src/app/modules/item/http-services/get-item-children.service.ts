import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { canCurrentUserViewInfo, itemViewPermDecoder, ItemWithViewPerm } from 'src/app/shared/models/domain/item-view-permission';
import { itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';
import { pipe } from 'fp-ts/lib/function';

const baseItemChildCategory = D.literal('Undefined', 'Discovery', 'Application', 'Validation', 'Challenge');

const baseItemChildDecoder = D.struct({
  id: D.string,
  order: D.number,
  category: baseItemChildCategory,
  permissions: itemCorePermDecoder,
  scoreWeight: D.number,
  contentViewPropagation: D.literal('none', 'as_info', 'as_content'),
  editPropagation: D.boolean,
  grantViewPropagation: D.boolean,
  upperViewLevelsPropagation: D.literal('use_content_view_propagation', 'as_content_with_descendants', 'as_is'),
  watchPropagation: D.boolean,
});

const itemChildTypeDecoder = D.literal('Chapter','Task','Skill');

const itemChildDecoder = pipe(
  baseItemChildDecoder,
  D.intersect(
    D.struct({
      bestScore: D.number,
      string: D.struct({
        title: D.nullable(D.string),
        imageUrl: D.nullable(D.string),
      }),
      type: itemChildTypeDecoder,
      results: D.array(D.struct({
        attemptId: D.string,
        latestActivityAt: dateDecoder,
        startedAt: D.nullable(dateDecoder),
        scoreComputed: D.number,
        validated: D.boolean,
      })),
    }),
  ),
  D.intersect(
    D.partial({
      watchedGroup: pipe(
        itemViewPermDecoder,
        D.intersect(
          D.partial({
            allValidated: D.boolean,
            avgScore: D.number,
          })
        )
      ),
    })
  )
);

const invisibleItemChildDecoder = baseItemChildDecoder;

const possiblyInvisibleItemChild = D.union(
  itemChildDecoder,
  invisibleItemChildDecoder,
);

export type BaseItemChildCategory = D.TypeOf<typeof baseItemChildCategory>;
export type ItemChild = D.TypeOf<typeof itemChildDecoder>;
type PossiblyInvisibleItemChild = D.TypeOf<typeof possiblyInvisibleItemChild>;
export type ItemChildType = D.TypeOf<typeof itemChildTypeDecoder>;

export function isVisibleItemChild(item: ItemWithViewPerm): item is ItemChild {
  return canCurrentUserViewInfo(item);
}


@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {

  constructor(private http: HttpClient) { }

  private getRaw(id: string, attemptId: string, options?: { showInvisible?: boolean, watchedGroupId?: string }): Observable<unknown[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    if (options?.watchedGroupId !== undefined) params = params.set('watched_group_id', options?.watchedGroupId);
    if (options?.showInvisible) params = params.set('show_invisible_items', '1');
    return this.http.get<unknown[]>(`${appConfig.apiUrl}/items/${id}/children`, { params });
  }

  get(id: string, attemptId: string, options?: { watchedGroupId?: string }): Observable<ItemChild[]> {
    return this.getRaw(id, attemptId, options).pipe(
      decodeSnakeCase(D.array(itemChildDecoder))
    );
  }

  getWithInvisibleItems(id: string, attemptId: string, options?: { watchedGroupId?: string }): Observable<PossiblyInvisibleItemChild[]> {
    return this.getRaw(id, attemptId, { ...options, showInvisible: true }).pipe(
      decodeSnakeCase(D.array(possiblyInvisibleItemChild))
    );
  }
}
