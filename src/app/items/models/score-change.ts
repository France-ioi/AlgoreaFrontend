import { FullItemRoute } from 'src/app/models/routing/item-route';

export interface ScoreChange { score: number, itemId: string, attemptId: string }

export function isScoreForRoute(
  event: ScoreChange,
  route: FullItemRoute | null | undefined,
): boolean {
  // Both ids: skip a late score after switching items, and after switching attempts so we never patch the newly selected attempt.
  return !!route && route.id === event.itemId && route.attemptId === event.attemptId;
}
