import { mergeEventsAndCheckpoints } from './history-list-merge';
import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { TaskHistoryElement } from 'src/app/items/api/types';

function event(at: string, activityType: ActivityLogs[number]['activityType'] = 'submission'): ActivityLogs[number] {
  return {
    activityType,
    at: new Date(at),
    attemptId: '0',
    item: { id: '1', string: { title: 'Task' }, type: 'Task' },
    participant: { id: 'u1', name: 'user', type: 'User' },
    answerId: 'ans-1',
    score: 80,
  };
}

function checkpoint(id: number, datetime: string, overrides: Partial<TaskHistoryElement> = {}): TaskHistoryElement {
  return {
    id,
    datetime,
    tags: [{ identifier: 'manual', i18nText: 'Manual' }],
    idUser: 'u1',
    isCheckpoint: true,
    sinceEarlier: { charsAdded: 10, charsRemoved: 2 },
    sinceEarlierCheckpoint: { charsAdded: 20, charsRemoved: 5, elementsCount: 3 },
    activeTab: { name: 'main.py', length: 120, progLang: 'python' },
    ...overrides,
  };
}

describe('mergeEventsAndCheckpoints', () => {
  it('returns a newest-first list with a submission between two checkpoints by time', () => {
    const rows = mergeEventsAndCheckpoints(
      [ event('2024-01-01T12:00:30Z') ],
      [
        checkpoint(3, '2024-01-01T12:01:00Z'),
        checkpoint(1, '2024-01-01T12:00:00Z'),
      ],
    );

    expect(rows.map(row => {
      if (row.kind === 'checkpoint') return `checkpoint:${row.checkpoint.id}`;
      return `event:${row.event.activityType}`;
    })).toEqual([
      'checkpoint:3',
      'event:submission',
      'checkpoint:1',
    ]);
  });

  it('places a checkpoint above an event at the same second (newest-first)', () => {
    const rows = mergeEventsAndCheckpoints(
      [ event('2024-01-01T12:00:00Z') ],
      [ checkpoint(1, '2024-01-01T12:00:00Z') ],
    );

    expect(rows.map(row => row.kind)).toEqual([ 'checkpoint', 'event' ]);
  });
});
