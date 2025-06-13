import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { z } from 'zod/v4';
import { decodeSnakeCase } from '../utils/operators/decode';
import { groupManagershipLevelSchema } from '../groups/models/group-management';

const typeSchema = z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]);

const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: typeSchema,
  canManage: groupManagershipLevelSchema,
  canWatchMembers: z.boolean(),
  canGrantGroupAccess: z.boolean(),
});

export type GroupType = z.infer<typeof typeSchema>;
export type Group = z.infer<typeof groupSchema>;

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/current-user/managed-groups`)
      .pipe(
        decodeSnakeCase(z.array(groupSchema)),
      );
  }

}


