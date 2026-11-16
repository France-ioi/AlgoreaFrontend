import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { canShowEventsAndEdits, HistoryViewMode, initialHistoryViewMode } from './history-view-mode';

export interface HistoryModeMemory {
  userChoseEventsOnly: boolean,
  seenNavigationKey: string,
  /** Survives an attempt-id URL change while Events & Edits is still loading the task. */
  pendingEditsLoad: boolean,
}

export type HistoryModeStep =
  | { type: 'apply', mode: HistoryViewMode, clearExpansions: boolean }
  | { type: 'reload' }
  | { type: 'none' };

export function followHistoryMode(
  memory: HistoryModeMemory,
  nav: string,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
  mode: HistoryViewMode,
  actions: {
    clearExpansions: () => void,
    applyMode: (mode: HistoryViewMode) => void,
    reload: () => void,
  },
): void {
  const step = historyModeStep(memory, nav, editsAttemptId, loaded, observedUserId, mode);
  if (step.type === 'reload') {
    actions.reload();
    return;
  }
  if (step.type !== 'apply') return;
  if (step.clearExpansions) actions.clearExpansions();
  actions.applyMode(step.mode);
}

/** User picked a segment. `loadTask` runs when edits need the attempt loaded first. */
export function chooseHistoryMode(
  memory: HistoryModeMemory,
  mode: HistoryViewMode,
  next: HistoryViewMode,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
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
    memory.pendingEditsLoad = false;
    actions.applyMode('events');
    return;
  }
  memory.userChoseEventsOnly = false;
  if (canShowEventsAndEdits(editsAttemptId, loaded, observedUserId)) {
    memory.pendingEditsLoad = false;
    actions.applyMode('events_and_edits');
    return;
  }
  memory.pendingEditsLoad = true;
  actions.showEditsLoading();
  if (editsAttemptId) actions.loadTask(editsAttemptId);
}

/**
 * Decide the next History mode from navigation and the loaded task.
 * A user's "Events only" choice sticks until they leave the page or the task has no editor history.
 */
export function historyModeStep(
  memory: HistoryModeMemory,
  nav: string,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
  mode: HistoryViewMode,
): HistoryModeStep {
  if (nav !== memory.seenNavigationKey) {
    memory.seenNavigationKey = nav;
    if (memory.pendingEditsLoad) {
      // Attempt URL changed while loading the observed/own edits attempt — keep waiting.
      memory.userChoseEventsOnly = false;
      return { type: 'apply', mode: 'events_and_edits', clearExpansions: true };
    }
    memory.userChoseEventsOnly = false;
    return {
      type: 'apply',
      mode: initialHistoryViewMode(editsAttemptId, loaded, observedUserId),
      clearExpansions: true,
    };
  }
  if (loaded?.savesEditorHistory === false) {
    memory.userChoseEventsOnly = false;
    memory.pendingEditsLoad = false;
    return mode === 'events' ? { type: 'none' } : { type: 'apply', mode: 'events', clearExpansions: false };
  }
  if (memory.userChoseEventsOnly) return { type: 'none' };
  if (!canShowEventsAndEdits(editsAttemptId, loaded, observedUserId)) return { type: 'none' };
  memory.pendingEditsLoad = false;
  if (mode !== 'events_and_edits') return { type: 'apply', mode: 'events_and_edits', clearExpansions: false };
  return { type: 'reload' };
}
