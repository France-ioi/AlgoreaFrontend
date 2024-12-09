import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import * as D from 'io-ts/Decoder';
import { z } from 'zod';
import { decodeSnakeCaseZod } from '../utils/operators/decode';

const typeSchema = z.union([
  z.literal('Class'),
  z.literal('Team'),
  z.literal('Club'),
  z.literal('Friends'),
  z.literal('Other'),
  z.literal('Session'),
  z.literal('Base'),
]);
export const manageTypeDecoder = D.literal('none', 'memberships', 'memberships_and_group');
const manageTypeSchema = z.union([
  z.literal('none'),
  z.literal('memberships'),
  z.literal('memberships_and_group'),
]);

const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: typeSchema,
  canManage: manageTypeSchema,
  canWatchMembers: z.boolean(),
  canGrantGroupAccess: z.boolean(),
});

export type GroupType = z.infer<typeof typeSchema>;
export type ManageType = z.infer<typeof manageTypeSchema>;
export type Group = z.infer<typeof groupSchema>;

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/current-user/managed-groups`)
      .pipe(
        decodeSnakeCaseZod(z.array(groupSchema)),
      );
  }

}


