import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { canShowEventsAndEdits, HistoryViewMode, initialHistoryViewMode } from './history-view-mode';

export interface HistoryModeMemory {
  userChoseEventsOnly: boolean,
  seenNavigationKey: string,
}

export type HistoryModeStep =
  | { type: 'apply', mode: HistoryViewMode, clearExpansions: boolean }
  | { type: 'reload' }
  | { type: 'none' };

export function followHistoryMode(
  memory: HistoryModeMemory,
  nav: string,
  isObserving: boolean,
  attemptId: string | undefined,
  loaded: LoadedItemTask | null,
  mode: HistoryViewMode,
  actions: {
    clearExpansions: () => void,
    applyMode: (mode: HistoryViewMode) => void,
    reload: () => void,
  },
): void {
  const step = historyModeStep(memory, nav, isObserving, attemptId, loaded, mode);
  if (step.type === 'reload') {
    actions.reload();
    return;
  }
  if (step.type !== 'apply') return;
  if (step.clearExpansions) actions.clearExpansions();
  actions.applyMode(step.mode);
}

/** User picked a segment. `loadTask` runs when edits need the URL attempt loaded first. */
export function chooseHistoryMode(
  memory: HistoryModeMemory,
  mode: HistoryViewMode,
  next: HistoryViewMode,
  isObserving: boolean,
  attemptId: string | undefined,
  loaded: LoadedItemTask | null,
  actions: {
    clearExpansions: () => void,
    applyMode: (mode: HistoryViewMode) => void,
    showEditsLoading: () => void,
    loadTask: (attemptId: string) => void,
  },
): void {
  if (next === mode) return;
  actions.clearExpansions();
  if (next === 'events') {
    memory.userChoseEventsOnly = true;
    actions.applyMode('events');
    return;
  }
  memory.userChoseEventsOnly = false;
  if (canShowEventsAndEdits(isObserving, attemptId, loaded)) {
    actions.applyMode('events_and_edits');
    return;
  }
  actions.showEditsLoading();
  if (attemptId) actions.loadTask(attemptId);
}

/**
 * Decide the next History mode from navigation and the loaded task.
 * A user's "Events only" choice sticks until they leave the page or the task has no editor history.
 */
export function historyModeStep(
  memory: HistoryModeMemory,
  nav: string,
  isObserving: boolean,
  attemptId: string | undefined,
  loaded: LoadedItemTask | null,
  mode: HistoryViewMode,
): HistoryModeStep {
  if (nav !== memory.seenNavigationKey) {
    memory.seenNavigationKey = nav;
    memory.userChoseEventsOnly = false;
    return { type: 'apply', mode: initialHistoryViewMode(isObserving, attemptId, loaded), clearExpansions: true };
  }
  if (loaded?.savesEditorHistory === false) {
    memory.userChoseEventsOnly = false;
    return mode === 'events' ? { type: 'none' } : { type: 'apply', mode: 'events', clearExpansions: false };
  }
  if (memory.userChoseEventsOnly) return { type: 'none' };
  if (!canShowEventsAndEdits(isObserving, attemptId, loaded)) return { type: 'none' };
  if (mode !== 'events_and_edits') return { type: 'apply', mode: 'events_and_edits', clearExpansions: false };
  return { type: 'reload' };
}
