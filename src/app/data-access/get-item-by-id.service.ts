import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { durationSchema } from 'src/app/utils/decoders';
import { itemCanRequestHelpSchema, itemCorePermSchema } from 'src/app/models/item-permissions';
import { itemStringSchema, withDescription } from '../models/item-string';
import { itemTypeSchema } from '../models/item-type';
import {
  itemChildrenLayoutSchema,
  itemEntryMinAdmittedMembersRatioSchema,
  itemFullScreenSchema,
  itemValidationTypeSchema
} from '../models/item-properties';
import { participantTypeSchema } from '../models/group-types';

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

  constructor(private http: HttpClient) {}

  get(id: string, watchedGroupId?: string): Observable<Item> {
    let params = new HttpParams();
    if (watchedGroupId) {
      params = params.set('watched_group_id', watchedGroupId);
    }
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${id}`, { params }).pipe(
      decodeSnakeCaseZod(itemSchema),
    );
  }

}
