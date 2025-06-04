import { z } from 'zod';

export function areSameThreads<T extends ThreadId, U extends ThreadId>(t1: T, t2: U): boolean {
  return t1.itemId === t2.itemId && t1.participantId === t2.participantId;
}

export interface ThreadId {
  participantId: string,
  itemId: string,
}

export const threadSchema = z.object({
  itemId: z.string(),
  participantId: z.string(),
  status: z.enum([ 'not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed' ]),
  token: z.string(),
});

export const threadTokenSchema = z.object({
  itemId: z.string(),
  participantId: z.string(),
  userId: z.string(),
  isMine: z.boolean(),
  canWatch: z.boolean(),
  canWrite: z.boolean(),
});

export type Thread = z.infer<typeof threadSchema> & z.infer<typeof threadTokenSchema>;

export function canCurrentUserLoadAnswers(thread: Thread): boolean {
  return thread.isMine || thread.canWatch;
}

export function statusOpen(thread: Thread): boolean {
  return [ 'waiting_for_participant', 'waiting_for_trainer' ].includes(thread.status);
}
