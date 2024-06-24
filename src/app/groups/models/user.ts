import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { z } from 'zod';
import { requirePersonalInfoAccessApprovalDecoder } from 'src/app/groups/models/group-approvals';

export const userBaseSchema = z.object({
  login: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

/* eslint-disable @typescript-eslint/explicit-function-return-type */ // Let type inference guess the return type (would be very verbose)
export const withGroupId = <T extends typeof userBaseSchema>(user: T) => user.extend({ groupId: z.string() });
export const withId = <T extends typeof userBaseSchema>(user: T) => user.extend({ id: z.string() });
export const withGrade = <T extends typeof userBaseSchema>(user: T) => user.extend({ grade: z.number().nullable() });
/* eslint-enable @typescript-eslint/explicit-function-return-type */

export type UserBase = z.infer<typeof userBaseSchema>;

export function formatUser<T extends UserBase>(user: T) : string {
  if (user.firstName || user.lastName) {
    let fullName = '';

    if (user.firstName) {
      fullName += user.firstName;
    }

    if (user.lastName) {
      fullName += user.firstName ? ` ${ user.lastName }` : user.lastName;
    }

    return `${ fullName } (${ user.login })`;
  }

  return user.login;
}

/** former version (to be removed/transformed soon) */

export const userDecoder = pipe(
  D.struct({
    groupId: D.string,
    login: D.string,
    tempUser: D.boolean,
    webSite: D.nullable(D.string),
    freeText: D.nullable(D.string),
    isCurrentUser: D.boolean,
    ancestorsCurrentUserIsManagerOf: D.array(D.struct({
      id: D.string,
      name: D.string,
    })),
  }),
  D.intersect(
    D.partial({
      firstName: D.nullable(D.string),
      lastName: D.nullable(D.string),
      currentUserCanWatchUser: D.boolean,
      currentUserCanGrantUserAccess: D.boolean,
      personalInfoAccessApprovalToCurrentUser: requirePersonalInfoAccessApprovalDecoder,
    }),
  ),
);

export type User = D.TypeOf<typeof userDecoder>;
