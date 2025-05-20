import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { canCurrentUserViewInfo, ItemViewPerm, itemViewPermSchema, ItemWithViewPerm } from 'src/app/items/models/item-view-permission';
import { itemCorePermSchema } from 'src/app/items/models/item-permissions';
import { itemChildCategorySchema } from '../items/models/item-properties';
import { itemPermPropagationsSchema } from '../items/models/item-perm-propagation';
import { itemTypeSchema } from '../items/models/item-type';
import { itemStringSchema } from '../items/models/item-string';

const baseItemChildSchema = z.object({
  id: z.string(),
  type: itemTypeSchema,
  order: z.number(),
  category: itemChildCategorySchema,
  permissions: itemCorePermSchema,
  scoreWeight: z.number(),
  requiresExplicitEntry: z.boolean().optional(),
}).and(itemPermPropagationsSchema);

/** an invisible item is an item which has a view perm set to 'none' */
const invisibleItemChildSchema = baseItemChildSchema.and(z.object({ permissions: z.object({ canView: z.literal(ItemViewPerm.None) }) }));

const itemChildSchema = baseItemChildSchema.and(z.object({
  bestScore: z.number(),
  string: itemStringSchema,
  results: z.array(z.object({
    attemptId: z.string(),
    latestActivityAt: z.coerce.date(),
    startedAt: z.coerce.date().nullable(),
    scoreComputed: z.number(),
    validated: z.boolean(),
  })),
  noScore: z.boolean(),
  watchedGroup: itemViewPermSchema.and(z.object({ allValidated: z.boolean().optional(), avgScore: z.number().optional() })).optional(),
}));

const itemChildrenSchema = z.array(itemChildSchema);
export type ItemChildren = z.infer<typeof itemChildrenSchema>;
const possiblyInvisibleItemChildrenSchema = z.array(z.union([ invisibleItemChildSchema, itemChildSchema ]));
type PossiblyInvisibleItemChildren = z.infer<typeof possiblyInvisibleItemChildrenSchema>;

export function isVisibleItemChild(item: ItemWithViewPerm): item is ItemChildren[number] {
  return canCurrentUserViewInfo(item);
}

@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  private getRaw(id: string, attemptId: string, options?: { showInvisible?: boolean, watchedGroupId?: string }): Observable<unknown[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    if (options?.watchedGroupId !== undefined) params = params.set('watched_group_id', options?.watchedGroupId);
    if (options?.showInvisible) params = params.set('show_invisible_items', '1');
    return this.http.get<unknown[]>(`${this.config.apiUrl}/items/${id}/children`, { params });
  }

  get(id: string, attemptId: string, options?: { watchedGroupId?: string }): Observable<ItemChildren> {
    return this.getRaw(id, attemptId, options).pipe(
      decodeSnakeCaseZod(itemChildrenSchema),
    );
  }

  getWithInvisibleItems(id: string, attemptId: string, options?: { watchedGroupId?: string }): Observable<PossiblyInvisibleItemChildren> {
    return this.getRaw(id, attemptId, { ...options, showInvisible: true }).pipe(
      decodeSnakeCaseZod(possiblyInvisibleItemChildrenSchema),
    );
  }
}
