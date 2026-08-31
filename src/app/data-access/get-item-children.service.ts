import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { canCurrentUserViewInfo, ItemViewPerm, itemViewPermSchema, ItemWithViewPerm } from 'src/app/items/models/item-view-permission';
import { itemCorePermSchema } from 'src/app/items/models/item-permissions';
import { itemChildCategorySchema } from '../items/models/item-properties';
import { itemPermPropagationsSchema } from '../items/models/item-perm-propagation';
import { itemTypeSchema } from '../items/models/item-type';
import { itemStringSchema, withDescription } from '../items/models/item-string';
import { displaySettingsSchema } from '../items/models/display-settings';

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

const visibleChildBodySchema = z.object({
  bestScore: z.number(),
  results: z.array(z.object({
    attemptId: z.string(),
    latestActivityAt: z.coerce.date(),
    startedAt: z.coerce.date().nullable(),
    scoreComputed: z.number(),
    validated: z.boolean(),
  })),
  noScore: z.boolean(),
  displaySettings: displaySettingsSchema.optional().default(() => displaySettingsSchema.parse({})),
  watchedGroup: itemViewPermSchema.and(z.object({ allValidated: z.boolean().optional(), avgScore: z.number().optional() })).optional(),
});

/** Leaf child: no further nesting (L2 under TwoLevels, or any child when the flag is off). No description. */
const leafItemChildSchema = baseItemChildSchema.and(visibleChildBodySchema).and(z.object({
  string: itemStringSchema,
}));

/**
 * Top-level child. Optional `children` when `show_level2_children` is on and the child is eligible.
 * Optional `string.description` when `include_description` is on and can_view >= content
 * (`null` = present but empty; absent = flag/gate off). Nested L2 entries never include description.
 */
const itemChildSchema = baseItemChildSchema.and(visibleChildBodySchema).and(z.object({
  string: withDescription(itemStringSchema),
  children: z.array(leafItemChildSchema).optional(),
}));

const itemChildrenSchema = z.array(itemChildSchema);
export type ItemChildren = z.infer<typeof itemChildrenSchema>;
const possiblyInvisibleItemChildrenSchema = z.array(z.union([ invisibleItemChildSchema, itemChildSchema ]));
type PossiblyInvisibleItemChildren = z.infer<typeof possiblyInvisibleItemChildrenSchema>;

export function isVisibleItemChild(item: ItemWithViewPerm): item is ItemChildren[number] {
  return canCurrentUserViewInfo(item);
}

export interface GetItemChildrenOptions {
  watchedGroupId?: string,
  showLevel2Children?: boolean,
  includeDescription?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GetItemChildrenService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  private getRaw(
    id: string,
    attemptId: string,
    options?: GetItemChildrenOptions & { showInvisible?: boolean },
  ): Observable<unknown[]> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    if (options?.watchedGroupId !== undefined) params = params.set('watched_group_id', options.watchedGroupId);
    if (options?.showInvisible) params = params.set('show_invisible_items', '1');
    if (options?.showLevel2Children) params = params.set('show_level2_children', '1');
    if (options?.includeDescription) params = params.set('include_description', '1');
    return this.http.get<unknown[]>(`${this.config.apiUrl}/items/${id}/children`, { params });
  }

  get(id: string, attemptId: string, options?: GetItemChildrenOptions): Observable<ItemChildren> {
    return this.getRaw(id, attemptId, options).pipe(
      decodeSnakeCase(itemChildrenSchema),
    );
  }

  getWithInvisibleItems(id: string, attemptId: string, options?: { watchedGroupId?: string }): Observable<PossiblyInvisibleItemChildren> {
    return this.getRaw(id, attemptId, { ...options, showInvisible: true }).pipe(
      decodeSnakeCase(possiblyInvisibleItemChildrenSchema),
    );
  }
}
