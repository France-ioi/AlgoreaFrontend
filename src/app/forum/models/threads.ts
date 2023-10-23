import * as D from 'io-ts/Decoder';

export function areSameThreads<T extends ThreadId, U extends ThreadId>(t1: T, t2: U): boolean {
  return t1.itemId === t2.itemId && t1.participantId === t2.participantId;
}

export interface ThreadId {
  participantId: string,
  itemId: string,
}

export const threadDecoder = D.struct({
  itemId: D.string,
  participantId: D.string,
  status: D.literal('not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed'),
  token: D.string,
});

const threadTokenDecoder = D.struct({
  itemId: D.string,
  participantId: D.string,
  userId: D.string,
  isMine: D.boolean,
  canWatch: D.boolean,
  canWrite: D.boolean,
});

export type Thread = D.TypeOf<typeof threadDecoder> & D.TypeOf<typeof threadTokenDecoder>;
