import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { durationSchema } from 'src/app/utils/decoders';
import { itemCanRequestHelpSchema, itemCorePermSchema } from 'src/app/items/models/item-permissions';
import { itemStringSchema, withDescription } from '../items/models/item-string';
import { itemTypeSchema } from '../items/models/item-type';
import {
  itemChildrenLayoutSchema,
  itemEntryMinAdmittedMembersRatioSchema,
  itemFullScreenSchema,
  itemValidationTypeSchema
} from '../items/models/item-properties';
import { participantTypeSchema } from '../groups/models/group-types';
import { APPCONFIG } from '../config';

const itemSchema = z.object({
  id: z.string(),
  requiresExplicitEntry: z.boolean(),
  string: withDescription(itemStringSchema),
  bestScore: z.number(),
  permissions: itemCorePermSchema.and(itemCanRequestHelpSchema),
  type: itemTypeSchema,
  promptToJoinGroupByCode: z.boolean(),
  textId: z.string().nullable(),
  validationType: itemValidationTypeSchema,
  noScore: z.boolean(),
  titleBarVisible: z.boolean(),
  fullScreen: itemFullScreenSchema,
  childrenLayout: itemChildrenLayoutSchema,
  allowsMultipleAttempts: z.boolean(),
  duration: durationSchema.nullable(),
  enteringTimeMin: z.coerce.date(),
  enteringTimeMax: z.coerce.date(),
  entryParticipantType: participantTypeSchema,
  entryFrozenTeams: z.boolean(),
  entryMaxTeamSize: z.number(),
  entryMinAdmittedMembersRatio: itemEntryMinAdmittedMembersRatioSchema,
  url: z.string().nullable().optional(),
  usesApi: z.boolean().nullable().optional(),
  watchedGroup: z.object({
    averageScore: z.number().optional(),
    permissions: itemCorePermSchema.optional(),
  }).optional()
});

export type Item = z.infer<typeof itemSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(id: string, options?: { watchedGroupId?: string, languageTag?: string }): Observable<Item> {
    let params = new HttpParams();
    if (options?.watchedGroupId) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }
    if (options?.languageTag) {
      params = params.set('language_tag', options.languageTag);
    }
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${id}`, { params }).pipe(
      decodeSnakeCase(itemSchema),
    );
  }

}
