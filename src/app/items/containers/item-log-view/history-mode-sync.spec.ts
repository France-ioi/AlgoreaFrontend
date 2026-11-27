import { chooseHistoryMode, HistoryModeActions, HistoryModeMemory, historyModeStep } from './history-mode-sync';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { HistoryModeChoice } from '../../services/history-mode-choice';
import { Task } from '../../api/task-proxy';

function ownLoaded(attemptId = '0'): LoadedItemTask {
  return { task: {} as Task, attemptId, savesEditorHistory: true };
}

function observedLoaded(participantId: string, attemptId = '0'): LoadedItemTask {
  return { task: {} as Task, attemptId, savesEditorHistory: true, participantId };
}

function memory(overrides: Partial<HistoryModeMemory> = {}): HistoryModeMemory {
  return { userChoseEventsOnly: false, seenNavigationKey: 'nav', pendingEditsLoad: false, awaitingEditsAttempt: false, ...overrides };
}

/** Memory of a History page that has not seen any navigation yet (just created, e.g. after a tab switch). */
function freshMemory(): HistoryModeMemory {
  return memory({ seenNavigationKey: '' });
}

function choiceOf(nav: string, mode: 'events' | 'events_and_edits'): HistoryModeChoice {
  const choice = new HistoryModeChoice();
  choice.remember(nav, mode);
  return choice;
}

function actionSpies(): jasmine.SpyObj<HistoryModeActions> {
  return jasmine.createSpyObj<HistoryModeActions>('actions', [
    'clearExpansions', 'applyMode', 'showEditsLoading', 'loadTask', 'reload',
  ]);
}

describe('historyModeStep', () => {
  describe('while observing a group', () => {
    it('does not promote to Events & Edits when the signed-in user task is loaded with editor history', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', ownLoaded(), null, true, 'events'))
        .toEqual({ type: 'none' });
    });

    it('does not reload editor history and falls back to Events only if Events & Edits was showing', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', ownLoaded(), null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('applies Events only on navigation into the group, even with the signed-in user task loaded', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'group-nav', '0', ownLoaded(), null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('drops a pending Events & Edits load on navigation into the group', () => {
      const mem = memory({ pendingEditsLoad: true });
      const choice = new HistoryModeChoice();
      expect(historyModeStep(mem, choice, 'group-nav', '0', null, null, true, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
      expect(mem.pendingEditsLoad).toBeFalse();
      expect(historyModeStep(mem, choice, 'group-nav', '0', ownLoaded(), null, true, 'events')).toEqual({ type: 'none' });
    });

    it('ignores a remembered Events & Edits choice', () => {
      expect(historyModeStep(freshMemory(), choiceOf('group-nav', 'events_and_edits'), 'group-nav', '0', ownLoaded(), null, true,
        'events')).toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });
  });

  describe('signed-in user History', () => {
    it('starts on Events & Edits on navigation when checkpoints are available', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'new-nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('starts on Events only on navigation when the task is not loaded', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'new-nav', '0', null, null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('promotes to Events & Edits once the task loads, then reloads on later updates', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: false });
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', ownLoaded(), null, false, 'events_and_edits'))
        .toEqual({ type: 'reload' });
    });

    it('keeps an Events only choice', () => {
      expect(historyModeStep(memory({ userChoseEventsOnly: true }), new HistoryModeChoice(), 'nav', '0', ownLoaded(), null, false,
        'events')).toEqual({ type: 'none' });
    });

    it('keeps waiting for a pending Events & Edits load across an attempt change', () => {
      expect(historyModeStep(memory({ pendingEditsLoad: true }), new HistoryModeChoice(), 'new-nav', '1', null, null, false,
        'events_and_edits')).toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('applies a remembered Events only choice on a fresh visit, and keeps it once the task is loaded', () => {
      const mem = freshMemory();
      const choice = choiceOf('nav', 'events');
      expect(historyModeStep(mem, choice, 'nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
      expect(historyModeStep(mem, choice, 'nav', '0', ownLoaded(), null, false, 'events')).toEqual({ type: 'none' });
    });

    it('applies a remembered Events & Edits choice on a fresh visit', () => {
      expect(historyModeStep(freshMemory(), choiceOf('nav', 'events_and_edits'), 'nav', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('ignores a choice remembered for another attempt or item', () => {
      const choice = choiceOf('item|0|0|', 'events');
      expect(historyModeStep(freshMemory(), choice, 'item|1|0|', '1', ownLoaded('1'), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
      expect(historyModeStep(freshMemory(), choice, 'item|0|0|', '0', ownLoaded(), null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('falls back to Events only for a remembered Events & Edits choice when the task saves no editor history', () => {
      const loaded = { ...ownLoaded(), savesEditorHistory: false };
      expect(historyModeStep(freshMemory(), choiceOf('nav', 'events_and_edits'), 'nav', '0', loaded, null, false, 'events'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });
  });

  describe('while observing a user', () => {
    it('starts on Events only on navigation', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'new-nav', '0', observedLoaded('u1'), 'u1', false, 'events_and_edits'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });

    it('promotes to Events & Edits once the observed user task is loaded', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', observedLoaded('u1'), 'u1', false, 'events'))
        .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: false });
    });

    it('ignores an iframe loaded with the observer own token', () => {
      expect(historyModeStep(memory(), new HistoryModeChoice(), 'nav', '0', ownLoaded(), 'u1', false, 'events'))
        .toEqual({ type: 'none' });
    });

    it('applies a remembered Events & Edits choice on a fresh visit when the observed task is still loaded', () => {
      expect(historyModeStep(freshMemory(), choiceOf('nav', 'events_and_edits'), 'nav', '0', observedLoaded('u1'), 'u1', false,
        'events')).toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
    });

    it('requests the observed task load for a remembered Events & Edits choice when it is not loaded', () => {
      const mem = freshMemory();
      const choice = choiceOf('nav', 'events_and_edits');
      expect(historyModeStep(mem, choice, 'nav', '0', ownLoaded(), 'u1', false, 'events')).toEqual({ type: 'load', attemptId: '0' });
      expect(historyModeStep(mem, choice, 'nav', '0', ownLoaded(), 'u1', false, 'events_and_edits')).toEqual({ type: 'none' });
      expect(historyModeStep(mem, choice, 'nav', '0', observedLoaded('u1'), 'u1', false, 'events_and_edits'))
        .toEqual({ type: 'reload' });
    });

    it('requests the load once the edits attempt is known, for a remembered Events & Edits choice', () => {
      const mem = freshMemory();
      const choice = choiceOf('nav', 'events_and_edits');
      expect(historyModeStep(mem, choice, 'nav', undefined, null, 'u1', false, 'events')).toEqual({ type: 'load', attemptId: undefined });
      expect(historyModeStep(mem, choice, 'nav', '3', null, 'u1', false, 'events_and_edits')).toEqual({ type: 'load', attemptId: '3' });
      expect(historyModeStep(mem, choice, 'nav', '3', null, 'u1', false, 'events_and_edits')).toEqual({ type: 'none' });
    });

    it('ignores and forgets a choice remembered while observing another user', () => {
      const choice = choiceOf('item|0|1|u1', 'events_and_edits');
      expect(historyModeStep(freshMemory(), choice, 'item|0|1|u2', '0', null, 'u2', false, 'events'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
      expect(historyModeStep(freshMemory(), choice, 'item|0|1|u1', '0', null, 'u1', false, 'events'))
        .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
    });
  });
});

describe('chooseHistoryMode', () => {
  it('remembers an explicit Events & Edits pick for a later visit with the same navigation', () => {
    const choice = new HistoryModeChoice();
    const actions = actionSpies();
    chooseHistoryMode(memory(), choice, 'events', 'events_and_edits', '0', null, 'u1', actions);
    expect(actions.showEditsLoading).toHaveBeenCalled();
    expect(actions.loadTask).toHaveBeenCalledWith('0');

    expect(historyModeStep(freshMemory(), choice, 'nav', '0', null, 'u1', false, 'events')).toEqual({ type: 'load', attemptId: '0' });
  });

  it('remembers an explicit Events only pick for a later visit with the same navigation', () => {
    const choice = new HistoryModeChoice();
    const actions = actionSpies();
    chooseHistoryMode(memory(), choice, 'events_and_edits', 'events', '0', ownLoaded(), null, actions);
    expect(actions.applyMode).toHaveBeenCalledWith('events');

    expect(historyModeStep(freshMemory(), choice, 'nav', '0', ownLoaded(), null, false, 'events'))
      .toEqual({ type: 'apply', mode: 'events', clearExpansions: true });
  });

  it('keeps the Events & Edits pick when the load moves the URL to the edits attempt', () => {
    const mem = memory({ seenNavigationKey: 'item||1|u1' });
    const choice = new HistoryModeChoice();
    chooseHistoryMode(mem, choice, 'events', 'events_and_edits', '3', null, 'u1', actionSpies());
    expect(historyModeStep(mem, choice, 'item|3|1|u1', '3', null, 'u1', false, 'events_and_edits'))
      .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });

    expect(historyModeStep(freshMemory(), choice, 'item|3|1|u1', '3', observedLoaded('u1', '3'), 'u1', false, 'events'))
      .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
  });

  it('does nothing when the mode is already selected', () => {
    const choice = new HistoryModeChoice();
    const actions = actionSpies();
    chooseHistoryMode(memory(), choice, 'events', 'events', '0', null, null, actions);
    expect(actions.applyMode).not.toHaveBeenCalled();
    expect(historyModeStep(freshMemory(), choice, 'nav', '0', ownLoaded(), null, false, 'events'))
      .toEqual({ type: 'apply', mode: 'events_and_edits', clearExpansions: true });
  });
});
