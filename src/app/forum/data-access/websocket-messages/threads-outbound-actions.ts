
export type ThreadAction = (
  | { action: 'forum.unsubscribe' }
  | { action: 'forum.subscribe' }
) & { token: string };

export function unsubscribeAction(token: string): ThreadAction {
  return { action: 'forum.unsubscribe', token };
}
export function subscribeAction(token: string): ThreadAction {
  return { action: 'forum.subscribe', token };
}
