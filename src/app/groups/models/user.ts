import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

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
