import { HistoryModeMemory, historyModeStep } from './history-mode-sync';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { Task } from '../../api/task-proxy';

function ownLoaded(attemptId = '0'): LoadedItemTask {
  return { task: {} as Task, attemptId, savesEditorHistory: true };
}

function observedLoaded(participantId: string, attemptId = '0'): LoadedItemTask {
  return { task: {} as Task, attemptId, savesEditorHistory: true, participantId };
}

function memory(overrides: Partial<HistoryModeMemory> = {}): HistoryModeMemory {
  return { userChoseEventsOnly: false, seenNavigationKey: 'nav', pendingEditsLoad: false, ...overrides };
}

describe('historyModeStep', () => {
  describe('while observing a group', () => {
    it('does not promote to Events & Edits when the signed-in user task is loaded with editor history', () => {
      expect(historyModeStep(memory(), 'nav', '0', ownLoaded(), null, true, 'events')).toEqual({ type: 'none' });
    });

    it('does not reload editor history and falls back to Events only if Events & Edits was showing', () => {
      expect(historyModeStep(memory(), 'nav', '0', ownLoaded(), null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('applies Events only on navigation into the group, even with the signed-in user task loaded', () => {
      expect(historyModeStep(memory(), 'group-nav', '0', ownLoaded(), null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('drops a pending Events & Edits load on navigation into the group', () => {
      const mem = memory({ pendingEditsLoad: true });
      expect(historyModeStep(mem, 'group-nav', '0', null, null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
      expect(mem.pendingEditsLoad).toBeFalse();
      expect(historyModeStep(mem, 'group-nav', '0', ownLoaded(), null, true, 'events')).toEqual({ type: 'none' });
    });
  });

  describe('signed-in user History', () => {
    it('starts on Events & Edits on navigation when checkpoints are available', () => {
      expect(historyModeStep(memory(), 'new-nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('promotes to Events & Edits once the task loads, then reloads on later updates', () => {
      expect(historyModeStep(memory(), 'nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: false });
      expect(historyModeStep(memory(), 'nav', '0', ownLoaded(), null, false, 'events_and_edits'))
        .toEqual({ type: 'reload' });
    });

    it('keeps an Events only choice', () => {
      expect(historyModeStep(memory({ userChoseEventsOnly: true }), 'nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'none' });
    });

    it('keeps waiting for a pending Events & Edits load across an attempt change', () => {
      expect(historyModeStep(memory({ pendingEditsLoad: true }), 'new-nav', '1', null, null, false, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });
  });

  describe('while observing a user', () => {
    it('starts on Events only on navigation', () => {
      expect(historyModeStep(memory(), 'new-nav', '0', observedLoaded('u1'), 'u1', false, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('promotes to Events & Edits once the observed user task is loaded', () => {
      expect(historyModeStep(memory(), 'nav', '0', observedLoaded('u1'), 'u1', false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: false });
    });

    it('ignores an iframe loaded with the observer own token', () => {
      expect(historyModeStep(memory(), 'nav', '0', ownLoaded(), 'u1', false, 'events')).toEqual({ type: 'none' });
    });
  });
});
