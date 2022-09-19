import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { groupCodeDecoder } from '../helpers/group-code';
import { groupManagershipDecoder } from '../helpers/group-management';

const groupShortInfo = D.struct({
  id: D.string,
  name: D.string,
});

const decoder = pipe(
  D.struct({
    id: D.string,
    type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base'),
    name: D.string,
    description: D.nullable(D.string),
    isMembershipLocked: D.boolean,
    isOpen: D.boolean,
    isPublic: D.boolean,
    createdAt: D.nullable(dateDecoder),
    grade: D.number,

    currentUserMembership: D.literal('none', 'direct', 'descendant'),
    currentUserManagership: D.literal('none', 'direct', 'ancestor', 'descendant'),
    ancestorsCurrentUserIsManagerOf: D.array(groupShortInfo),
    descendantsCurrentUserIsManagerOf: D.array(groupShortInfo),
    descendantsCurrentUserIsMemberOf: D.array(groupShortInfo),

    rootActivityId: D.nullable(D.string),
    rootSkillId: D.nullable(D.string),
    openActivityWhenJoining: D.boolean,
  }),
  D.intersect(groupCodeDecoder),
  D.intersect(groupManagershipDecoder)
);

export type Group = D.TypeOf<typeof decoder>;
export type GroupShortInfo = D.TypeOf<typeof groupShortInfo>;

@Injectable({
  providedIn: 'root',
})
export class GetGroupByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Group> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${id}`).pipe(
      decodeSnakeCase(decoder),
    );
  }

}
