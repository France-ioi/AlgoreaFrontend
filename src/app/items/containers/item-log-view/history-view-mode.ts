import { Result } from '../../models/attempts';
import { buildAttemptRows } from '../item-attempts/attempt-rows';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { isUser, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ItemType } from 'src/app/items/models/item-type';
import { HistoryListRow } from './history-list-merge';

/** Item-route observedGroup or fetched observation route. */
export type ObservedGroupForHistoryMode = RawGroupRoute | { id: string, isUser: boolean } | null;

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
 * Attempt for the observer's Events & Edits option: the loaded task's attempt when that task is
 * already the observed user's; otherwise the newest activity-log row. An iframe with the observer's
 * own token does not count.
 */
export function observerEditsAttemptId(
  loaded: LoadedItemTask | null,
  observedUserId: string,
  newestLogAttemptId: string | undefined,
): string | undefined {
  if (loaded?.participantId === observedUserId) return loaded.attemptId;
  return newestLogAttemptId;
}

/** Newest-first event list → attempt id of the first event row. */
export function newestActivityLogAttemptId(rows: HistoryListRow[]): string | undefined {
  const eventRow = rows.find(row => row.kind === 'event');
  return eventRow?.kind === 'event' ? eventRow.event.attemptId : undefined;
}

/**
 * True when checkpoints can be read now for the edits attempt.
 * Own: signed-in user's task loaded on that attempt with editor history.
 * Observer: loaded task must be the observed user's (own-token iframe does not count).
 */
export function canShowEventsAndEdits(
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
): boolean {
  if (!editsAttemptId || !loaded || loaded.savesEditorHistory !== true) return false;
  if (loaded.attemptId !== editsAttemptId) return false;
  if (observedUserId) return loaded.participantId === observedUserId;
  return loaded.participantId === undefined;
}

/**
 * Show the mode control when Events & Edits is a real choice.
 * Hidden on chapters, while observing a group, when the observer may not watch answers,
 * when observing a user but no edits attempt is known yet, and once metadata says the task
 * does not save editor history.
 */
export function shouldShowHistoryModeSelection(
  itemType: ItemType,
  observedGroupRoute: ObservedGroupForHistoryMode,
  canWatchAnswers: boolean,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
): boolean {
  if (itemType !== 'Task') return false;
  if (observedGroupRoute && !isUser(observedGroupRoute)) return false;
  if (observedGroupRoute && isUser(observedGroupRoute)) {
    if (!canWatchAnswers) return false;
    if (editsAttemptId === undefined) return false;
  }
  if (loaded?.savesEditorHistory === false) return false;
  return true;
}

/**
 * Default to Events & Edits only when the signed-in user's checkpoints are already available.
 * Observers always start on Events only so opening History does not load the student's task.
 */
export function initialHistoryViewMode(
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
): HistoryViewMode {
  if (observedUserId) return 'events';
  return canShowEventsAndEdits(editsAttemptId, loaded, null) ? 'events_and_edits' : 'events';
}
