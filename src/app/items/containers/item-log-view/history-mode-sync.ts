import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { HistoryModeChoice } from '../../services/history-mode-choice';
import { canShowEventsAndEdits, HistoryViewMode, initialHistoryViewMode } from './history-view-mode';

export interface HistoryModeMemory {
  userChoseEventsOnly: boolean,
  seenNavigationKey: string,
  /** Survives an attempt-id URL change while Events & Edits is still loading the task. */
  pendingEditsLoad: boolean,
  /** Events & Edits is loading but its attempt is not known yet (observer, activity log still loading). */
  awaitingEditsAttempt: boolean,
}

export type HistoryModeStep =
  | { type: 'apply', mode: HistoryViewMode, clearExpansions: boolean }
  /** Show Events & Edits as loading, and ask for the task to be loaded on the attempt once it is known. */
  | { type: 'load', attemptId: string | undefined }
  | { type: 'reload' }
  | { type: 'none' };

export interface HistoryModeActions {
  clearExpansions: () => void,
  applyMode: (mode: HistoryViewMode) => void,
  showEditsLoading: () => void,
  loadTask: (attemptId: string) => void,
  reload: () => void,
}

export function followHistoryMode(
  memory: HistoryModeMemory,
  choice: HistoryModeChoice,
  nav: string,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
  observingGroup: boolean,
  mode: HistoryViewMode,
  actions: HistoryModeActions,
): void {
  runHistoryModeStep(
    historyModeStep(memory, choice, nav, editsAttemptId, loaded, observedUserId, observingGroup, mode),
    actions,
  );
}

/** User picked a segment: remember it for the current navigation, then apply it (loading the task if needed). */
export function chooseHistoryMode(
  memory: HistoryModeMemory,
  choice: HistoryModeChoice,
  mode: HistoryViewMode,
  next: HistoryViewMode,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
  actions: HistoryModeActions,
): void {
  if (next === mode) return;
  choice.remember(memory.seenNavigationKey, next);
  runHistoryModeStep(explicitModeStep(memory, next, editsAttemptId, loaded, observedUserId), actions);
}

/**
 * Decide the next History mode from navigation and the loaded task.
 * A user's explicit choice sticks until they leave the item page (see `HistoryModeChoice`) or the task has
 * no editor history. While observing a group, History is always Events only: any loaded task is the observer's own.
 */
export function historyModeStep(
  memory: HistoryModeMemory,
  choice: HistoryModeChoice,
  nav: string,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
  observingGroup: boolean,
  mode: HistoryViewMode,
): HistoryModeStep {
  if (observingGroup) {
    const navChanged = nav !== memory.seenNavigationKey;
    memory.seenNavigationKey = nav;
    memory.userChoseEventsOnly = false;
    memory.pendingEditsLoad = false;
    memory.awaitingEditsAttempt = false;
    // Only to forget a choice taken for the previous navigation: a group never applies one.
    if (navChanged) choice.recall(nav);
    return navChanged || mode !== 'events' ? { type: 'apply', mode: 'events', clearExpansions: true } : { type: 'none' };
  }
  if (nav !== memory.seenNavigationKey) {
    memory.seenNavigationKey = nav;
    if (memory.pendingEditsLoad) {
      // Attempt URL changed while loading the observed/own edits attempt — keep waiting, and keep the choice.
      memory.userChoseEventsOnly = false;
      choice.remember(nav, 'events_and_edits');
      return { type: 'apply', mode: 'events_and_edits', clearExpansions: true };
    }
    const remembered = choice.recall(nav);
    if (remembered === 'events' || (remembered === 'events_and_edits' && loaded?.savesEditorHistory !== false)) {
      return explicitModeStep(memory, remembered, editsAttemptId, loaded, observedUserId);
    }
    memory.userChoseEventsOnly = false;
    memory.awaitingEditsAttempt = false;
    return {
      type: 'apply',
      mode: initialHistoryViewMode(editsAttemptId, loaded, observedUserId, observingGroup),
      clearExpansions: true,
    };
  }
  if (loaded?.savesEditorHistory === false) {
    memory.userChoseEventsOnly = false;
    memory.pendingEditsLoad = false;
    memory.awaitingEditsAttempt = false;
    return mode === 'events' ? { type: 'none' } : { type: 'apply', mode: 'events', clearExpansions: false };
  }
  if (memory.userChoseEventsOnly) return { type: 'none' };
  if (!canShowEventsAndEdits(editsAttemptId, loaded, observedUserId)) {
    if (!memory.awaitingEditsAttempt || editsAttemptId === undefined) return { type: 'none' };
    memory.awaitingEditsAttempt = false;
    return { type: 'load', attemptId: editsAttemptId };
  }
  memory.pendingEditsLoad = false;
  memory.awaitingEditsAttempt = false;
  if (mode !== 'events_and_edits') return { type: 'apply', mode: 'events_and_edits', clearExpansions: false };
  return { type: 'reload' };
}

/** A mode picked by the user, now or earlier under the same navigation. */
function explicitModeStep(
  memory: HistoryModeMemory,
  next: HistoryViewMode,
  editsAttemptId: string | undefined,
  loaded: LoadedItemTask | null,
  observedUserId: string | null,
): HistoryModeStep {
  memory.userChoseEventsOnly = next === 'events';
  if (next === 'events' || canShowEventsAndEdits(editsAttemptId, loaded, observedUserId)) {
    memory.pendingEditsLoad = false;
    memory.awaitingEditsAttempt = false;
    return { type: 'apply', mode: next, clearExpansions: true };
  }
  memory.pendingEditsLoad = true;
  memory.awaitingEditsAttempt = editsAttemptId === undefined;
  return { type: 'load', attemptId: editsAttemptId };
}

function runHistoryModeStep(step: HistoryModeStep, actions: HistoryModeActions): void {
  switch (step.type) {
    case 'apply':
      if (step.clearExpansions) actions.clearExpansions();
      actions.applyMode(step.mode);
      return;
    case 'load':
      actions.clearExpansions();
      actions.showEditsLoading();
      if (step.attemptId) actions.loadTask(step.attemptId);
      return;
    case 'reload':
      actions.reload();
      return;
    case 'none':
      return;
  }
}
