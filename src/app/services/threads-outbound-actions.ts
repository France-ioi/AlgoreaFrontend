import { ThreadEvent } from './threads-events';

export type ThreadAction = (
  | { action: 'unsubscribe' }
  | { action: 'subscribe' }
  | { action: 'publish', events: (ThreadEvent & { time?: number })[] }
) & { token: string };

export function unsubscribeAction(token: string): ThreadAction {
  return { action: 'unsubscribe', token };
}
export function subscribeAction(token: string): ThreadAction {
  return { action: 'subscribe', token };
}
export function publishEventsAction(token: string, events: (ThreadEvent & { time?: number })[]): ThreadAction {
  return { action: 'publish', events: events, token };
}
