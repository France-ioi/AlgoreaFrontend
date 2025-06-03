import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { groupCodeSchema } from '../models/group-code';
import { groupManagershipSchema } from '../models/group-management';
import { groupApprovalsSchema } from 'src/app/groups/models/group-approvals';
import { z } from 'zod';

const groupShortInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const groupSchema = z.object({
  id: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]),
  name: z.string(),
  description: z.string().nullable(),
  isMembershipLocked: z.boolean(),
  isOpen: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.coerce.date().nullable(),
  grade: z.number(),

  currentUserMembership: z.enum([ 'none', 'direct', 'descendant' ]),
  currentUserManagership: z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]),
  ancestorsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsMemberOf: z.array(groupShortInfoSchema),

  rootActivityId: z.string().nullable(),
  rootSkillId: z.string().nullable(),
  openActivityWhenJoining: z.boolean(),
}).and(groupCodeSchema).and(groupManagershipSchema).and(groupApprovalsSchema);

export type Group = z.infer<typeof groupSchema>;
export type GroupShortInfo = z.infer<typeof groupShortInfoSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetGroupByIdService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Group> {
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${id}`).pipe(
      decodeSnakeCase(groupSchema),
    );
  }

}
