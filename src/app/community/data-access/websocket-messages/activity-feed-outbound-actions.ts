export function subscribeLiveActivityAction(): { action: string } {
  return { action: 'liveActivity.subscribe' };
}

export function unsubscribeLiveActivityAction(): { action: string } {
  return { action: 'liveActivity.unsubscribe' };
}
