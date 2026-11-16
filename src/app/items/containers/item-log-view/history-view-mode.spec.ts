import {
  attemptNumberForLabel,
  canShowEventsAndEdits,
  initialHistoryViewMode,
  newestActivityLogAttemptId,
  observerEditsAttemptId,
  shouldShowHistoryModeSelection,
} from './history-view-mode';
import { Result } from '../../models/attempts';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { Task } from '../../api/task-proxy';
import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { HistoryListRow } from './history-list-merge';

function result(attemptId: string, startedAt: string): Result {
  return {
    attemptId,
    latestActivityAt: new Date(startedAt),
    score: 0,
    validated: false,
    startedAt: new Date(startedAt),
    endedAt: null,
    allowsSubmissionsUntil: new Date('9999-12-31T00:00:00Z'),
  };
}

function ownLoaded(attemptId = '0'): LoadedItemTask {
  return {
    task: {} as Task,
    attemptId,
    savesEditorHistory: true,
  };
}

function observedLoaded(participantId: string, attemptId = '0'): LoadedItemTask {
  return {
    task: {} as Task,
    attemptId,
    savesEditorHistory: true,
    participantId,
  };
}

describe('history-view-mode helpers', () => {
  describe('attemptNumberForLabel', () => {
    it('returns null for a single attempt', () => {
      expect(attemptNumberForLabel([ result('0', '2024-01-01T00:00:00Z') ], '0')).toBeNull();
    });

    it('returns the 1-based Attempts-tab number when there are several attempts', () => {
      const results = [
        result('b', '2024-01-02T00:00:00Z'),
        result('a', '2024-01-01T00:00:00Z'),
      ];
      expect(attemptNumberForLabel(results, 'b')).toBe(2);
      expect(attemptNumberForLabel(results, 'a')).toBe(1);
    });
  });

  describe('observerEditsAttemptId / newestActivityLogAttemptId', () => {
    it('uses the loaded attempt when that task belongs to the observed user', () => {
      expect(observerEditsAttemptId(observedLoaded('u1', '7'), 'u1', '3')).toBe('7');
    });

    it('ignores an iframe loaded with the observer own token', () => {
      expect(observerEditsAttemptId(ownLoaded('0'), 'u1', '3')).toBe('3');
    });

    it('falls back to the newest activity-log attempt', () => {
      expect(observerEditsAttemptId(null, 'u1', '3')).toBe('3');
      expect(observerEditsAttemptId(null, 'u1', undefined)).toBeUndefined();
    });

    it('reads the newest event row attempt id', () => {
      const event = { attemptId: '9' } as ActivityLogs[number];
      const rows: HistoryListRow[] = [
        { kind: 'event', at: new Date('2024-06-02T00:00:00Z'), event },
      ];
      expect(newestActivityLogAttemptId(rows)).toBe('9');
      expect(newestActivityLogAttemptId([])).toBeUndefined();
    });
  });

  describe('canShowEventsAndEdits / selection visibility', () => {
    it('is available for the signed-in user when their task is loaded on the edits attempt with history', () => {
      expect(canShowEventsAndEdits('0', ownLoaded(), null)).toBeTrue();
      expect(canShowEventsAndEdits('0', null, null)).toBeFalse();
      expect(canShowEventsAndEdits('1', ownLoaded(), null)).toBeFalse();
      expect(canShowEventsAndEdits('0', observedLoaded('u1'), null)).toBeFalse();
    });

    it('is available for an observer only when the loaded task is the observed user on that attempt', () => {
      expect(canShowEventsAndEdits('0', observedLoaded('u1'), 'u1')).toBeTrue();
      expect(canShowEventsAndEdits('0', ownLoaded(), 'u1')).toBeFalse();
      expect(canShowEventsAndEdits('1', observedLoaded('u1'), 'u1')).toBeFalse();
      expect(canShowEventsAndEdits('0', observedLoaded('other'), 'u1')).toBeFalse();
    });

    it('hides the control on chapters, groups, when answers cannot be watched, or when the task does not save history', () => {
      expect(shouldShowHistoryModeSelection('Chapter', null, true, '0', ownLoaded())).toBeFalse();
      expect(shouldShowHistoryModeSelection(
        'Task',
        rawGroupRoute({ id: 'g1', isUser: false }),
        true,
        '0',
        ownLoaded(),
      )).toBeFalse();
      expect(shouldShowHistoryModeSelection(
        'Task',
        rawGroupRoute({ id: 'u1', isUser: true }),
        false,
        '0',
        null,
      )).toBeFalse();
      expect(shouldShowHistoryModeSelection(
        'Task',
        null,
        true,
        '0',
        { ...ownLoaded(), savesEditorHistory: false },
      )).toBeFalse();
    });

    it('shows the control while observing a user who can be watched, including before the task is loaded', () => {
      expect(shouldShowHistoryModeSelection(
        'Task',
        rawGroupRoute({ id: 'u1', isUser: true }),
        true,
        '3',
        null,
      )).toBeTrue();
    });

    it('hides the control while observing a user when no edits attempt is known yet', () => {
      expect(shouldShowHistoryModeSelection(
        'Task',
        rawGroupRoute({ id: 'u1', isUser: true }),
        true,
        undefined,
        null,
      )).toBeFalse();
    });

    it('shows the control when the signed-in user task is not loaded, so choosing edits can load it', () => {
      expect(shouldShowHistoryModeSelection('Task', null, true, '0', null)).toBeTrue();
    });

    it('shows the control when the task is loaded on another attempt', () => {
      expect(shouldShowHistoryModeSelection('Task', null, true, '1', ownLoaded())).toBeTrue();
    });

    it('shows the control when Events & Edits is available', () => {
      expect(shouldShowHistoryModeSelection('Task', null, true, '0', ownLoaded())).toBeTrue();
    });
  });

  describe('initialHistoryViewMode', () => {
    it('selects Events & Edits only for the signed-in user when checkpoints are already available', () => {
      expect(initialHistoryViewMode('0', ownLoaded(), null)).toBe('events_and_edits');
      expect(initialHistoryViewMode('0', null, null)).toBe('events');
      expect(initialHistoryViewMode('1', ownLoaded(), null)).toBe('events');
    });

    it('always starts on Events only while observing a user', () => {
      expect(initialHistoryViewMode('0', observedLoaded('u1'), 'u1')).toBe('events');
    });
  });
});
