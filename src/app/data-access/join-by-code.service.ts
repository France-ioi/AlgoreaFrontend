import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { groupApprovalsSchema } from 'src/app/groups/models/group-approvals';

const managerSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  login: z.string(),
});

const groupSchema = z.object({
  name: z.string(),
  rootActivityId: z.string().nullable(),
  rootSkillId: z.string().nullable(),
  managers: z.array(managerSchema),
}).and(groupApprovalsSchema);

const invalidReasonSchema = z.enum([
  'no_group',
  'frozen_membership',
  'already_member',
  'conflicting_team_participation',
  'team_conditions_not_met',
]);

const isCodeValidSchema = z.object({
  valid: z.boolean(),
}).and(z.object({
  group: groupSchema,
  reason: invalidReasonSchema,
}).partial());

export type IsCodeValid = z.infer<typeof isCodeValidSchema>;

export type InvalidCodeReason = z.infer<typeof invalidReasonSchema>;

@Injectable({
  providedIn: 'root'
})
export class JoinByCodeService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  checkCodeValidity(code: string): Observable<IsCodeValid> {
    let params = new HttpParams();
    params = params.set('code', code);
    return this.http
      .get<unknown>(`${this.config.apiUrl}/groups/is-code-valid`,
        { params: params })
      .pipe(
        decodeSnakeCase(isCodeValidSchema),
      );
  }

  joinGroupThroughCode(code: string, approvals: string[] = []): Observable<void> {
    let params = new HttpParams();
    params = params.set('code', code).set('approvals', approvals.join(','));
    return this.http
      .post<SimpleActionResponse>(`${this.config.apiUrl}/current-user/group-memberships/by-code`, null, { params: params })
      .pipe(
        map(assertSuccess)
      );
  }
}
