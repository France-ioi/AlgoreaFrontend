import {
  attemptNumberForLabel,
  canShowEventsAndEdits,
  initialHistoryViewMode,
  shouldShowHistoryModeSelection,
} from './history-view-mode';
import { Result } from '../../models/attempts';
import { LoadedItemTask } from '../../services/item-loaded-task-registry';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { Task } from '../../api/task-proxy';

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

  describe('canShowEventsAndEdits / selection visibility', () => {
    const loaded = {
      task: {} as Task,
      attemptId: '0',
      savesEditorHistory: true,
    } as LoadedItemTask;

    it('is available only when the own task is loaded on the URL attempt with history', () => {
      expect(canShowEventsAndEdits(false, '0', loaded)).toBeTrue();
      expect(canShowEventsAndEdits(true, '0', loaded)).toBeFalse();
      expect(canShowEventsAndEdits(false, '0', null)).toBeFalse();
      expect(canShowEventsAndEdits(false, '1', loaded)).toBeFalse();
    });

    it('hides the control on chapters, groups, while observing, or when the task does not save history', () => {
      expect(shouldShowHistoryModeSelection('Chapter', null, false, '0', loaded)).toBeFalse();
      expect(shouldShowHistoryModeSelection('Task', rawGroupRoute({ id: 'g1', isUser: false }), false, '0', loaded))
        .toBeFalse();
      expect(shouldShowHistoryModeSelection(
        'Task',
        rawGroupRoute({ id: 'u1', isUser: true }),
        true,
        '0',
        loaded,
      )).toBeFalse();
      expect(shouldShowHistoryModeSelection(
        'Task',
        null,
        false,
        '0',
        { ...loaded, savesEditorHistory: false },
      )).toBeFalse();
    });

    it('shows the control when the task is not loaded, so choosing edits can load it', () => {
      expect(shouldShowHistoryModeSelection('Task', null, false, '0', null)).toBeTrue();
    });

    it('shows the control when the task is loaded on another attempt', () => {
      expect(shouldShowHistoryModeSelection('Task', null, false, '1', loaded)).toBeTrue();
    });

    it('shows the control when Events & Edits is available', () => {
      expect(shouldShowHistoryModeSelection('Task', null, false, '0', loaded)).toBeTrue();
    });
  });

  describe('initialHistoryViewMode', () => {
    it('selects Events & Edits only when checkpoints are available', () => {
      const loaded = { attemptId: '0', savesEditorHistory: true } as LoadedItemTask;
      expect(initialHistoryViewMode(false, '0', loaded)).toBe('events_and_edits');
      expect(initialHistoryViewMode(true, '0', loaded)).toBe('events');
      expect(initialHistoryViewMode(false, '0', null)).toBe('events');
      expect(initialHistoryViewMode(false, '1', loaded)).toBe('events');
    });
  });
});
