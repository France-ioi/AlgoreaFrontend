import { ThreadEvent } from './threads-events';

export interface ThreadToken {
  participantId: string,
  itemId: string,
  userId: string,
  isMine: boolean,
  canWatchParticipant: boolean,
}

export type ThreadAction = (
  | { action: 'unsubscribe' }
  | { action: 'subscribe' }
  | { action: 'publish', events: (ThreadEvent & { time?: number })[] }
) & { token: ThreadToken };

export function unsubscribeAction(token: ThreadToken): ThreadAction {
  return { action: 'unsubscribe', token };
}
export function subscribeAction(token: ThreadToken): ThreadAction {
  return { action: 'subscribe', token };
}
export function publishEventsAction(token: ThreadToken, events: (ThreadEvent & { time?: number })[]): ThreadAction {
  return { action: 'publish', events: events, token };
}
