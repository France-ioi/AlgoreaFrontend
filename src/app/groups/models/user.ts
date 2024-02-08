import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { z } from 'zod';

export const userSchema = z.object({
  groupId: z.string(),
  login: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

// Let type inference guess the return type (would be very long to type)
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withGrade = <T extends typeof userSchema>(user: T) => user.and(
  z.object({
    grade: z.number().nullable(),
  })
);

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
    }),
  ),
);

export type User = D.TypeOf<typeof userDecoder>;
