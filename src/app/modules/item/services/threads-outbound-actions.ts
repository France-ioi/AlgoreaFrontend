import { ThreadEvent } from './threads-events';

export type ThreadAction =
  | typeof UNSUBSCRIBE
  | typeof SUBSCRIBE
  | { action: 'publish', events: (ThreadEvent & { time?: number })[] };

export const UNSUBSCRIBE = { action: 'unsubscribe' as const };
export const SUBSCRIBE = { action: 'subscribe' as const };

export function publishEventsAction(events: (ThreadEvent & { time?: number })[]): ThreadAction {
  return { action: 'publish', events: events };
}
