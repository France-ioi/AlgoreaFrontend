import { Result } from '../../models/attempts';
import { buildAttemptRows } from '../item-attempts/attempt-rows';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { isUser, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ItemType } from 'src/app/items/models/item-type';

export type HistoryViewMode = 'events' | 'events_and_edits';

export function historyModeOptions(attemptNumber: number | null): { label: string, value: HistoryViewMode }[] {
  const editsLabel = attemptNumber === null
    ? $localize`Events & Edits`
    : $localize`Events & Edits of attempt #${attemptNumber}:attemptNumber:`;
  return [
    { label: $localize`Events only`, value: 'events' },
    { label: editsLabel, value: 'events_and_edits' },
  ];
}

/** Attempt number as on the Attempts tab, or null when the label should omit it. */
export function attemptNumberForLabel(results: Result[] | undefined, attemptId: string | undefined): number | null {
  if (!results || results.length <= 1 || attemptId === undefined) return null;
  const row = buildAttemptRows(results, attemptId).find(r => r.result.attemptId === attemptId);
  return row?.number ?? null;
}

/**
 * True when checkpoints can be read now: the signed-in user's task is already loaded on the URL attempt
 * and it saves editor history.
 */
export function canShowEventsAndEdits(
  isObserving: boolean,
  routeAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
): boolean {
  if (isObserving) return false;
  return !!loaded
    && routeAttemptId !== undefined
    && loaded.attemptId === routeAttemptId
    && loaded.savesEditorHistory === true;
}

/**
 * Show the mode control when Events & Edits is a real choice.
 * Hidden on chapters, while observing (group or user — the observer view is separate), and once
 * metadata says the task does not save editor history.
 * Shown when the task is not loaded yet, or is loaded on another attempt: choosing Events & Edits
 * loads the URL attempt. `routeAttemptId` is unused until that load; kept so callers pass the route.
 */
export function shouldShowHistoryModeSelection(
  itemType: ItemType,
  observedGroupRoute: RawGroupRoute | null,
  isObserving: boolean,
  _routeAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
): boolean {
  if (itemType !== 'Task') return false;
  if (isObserving) return false;
  if (observedGroupRoute && !isUser(observedGroupRoute)) return false;
  if (loaded?.savesEditorHistory === false) return false;
  return true;
}

/** Default to Events & Edits only when checkpoints are available for the URL attempt. */
export function initialHistoryViewMode(
  isObserving: boolean,
  routeAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
): HistoryViewMode {
  return canShowEventsAndEdits(isObserving, routeAttemptId, loaded) ? 'events_and_edits' : 'events';
}
