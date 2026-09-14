import { FullItemRoute, newAttemptId, ResultsFetchKey } from 'src/app/models/routing/item-route';
import { FetchState } from 'src/app/utils/state';
import { bestAttemptFromResults, implicitResultStart, Result } from '../../models/attempts';
import { canCurrentUserViewContent } from '../../models/item-view-permission';
import { Item } from './item-content.state';

/**
 * Decides whether the active item URL still needs a self `attemptId`.
 * null = nothing to resolve (no item, cannot view content, URL already names a real attempt,
 *   or `a=new` on an explicit-entry item)
 * { kind: 'pick', attemptId } = an existing attempt should be put in the URL
 * { kind: 'start' } = no suitable attempt and the item allows an implicit start
 */
export type AttemptResolution =
  | { kind: 'pick', attemptId: string }
  | { kind: 'start' };

/** Pure projector for `selectAttemptResolution` (and its unit tests). */
export function attemptResolution(
  route: FullItemRoute | null,
  item: Item | null,
  resultsState: FetchState<Result[], ResultsFetchKey>,
): AttemptResolution | null {
  if (route === null || item === null || !resultsState.isReady) return null;
  if (route.attemptId !== undefined && route.attemptId !== newAttemptId) return null;
  if (!canCurrentUserViewContent(item)) return null;
  // `a=new`: the user explicitly asked for a fresh attempt, do not pick an existing one
  if (route.attemptId === newAttemptId && item.requiresExplicitEntry) return null;
  const best = bestAttemptFromResults(resultsState.data);
  if (best !== null) return { kind: 'pick', attemptId: best.attemptId };
  if (implicitResultStart(item)) return { kind: 'start' };
  return null;
}
