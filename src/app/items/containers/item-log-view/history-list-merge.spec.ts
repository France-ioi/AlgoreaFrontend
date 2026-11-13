import { mergeEventsAndCheckpoints, mergeHistoryBuffers } from './history-list-merge';
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

function rowLabels(
  rows: ReturnType<typeof mergeEventsAndCheckpoints>,
): string[] {
  return rows.map(row => {
    if (row.kind === 'checkpoint') return `checkpoint:${row.checkpoint.id}`;
    return `event:${row.event.at.toISOString()}`;
  });
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

describe('mergeHistoryBuffers', () => {
  it('shows the full merge when both streams are exhausted', () => {
    const result = mergeHistoryBuffers({
      events: [ event('2024-01-01T12:00:30Z') ],
      eventsHasMore: false,
      checkpoints: [
        checkpoint(3, '2024-01-01T12:01:00Z'),
        checkpoint(1, '2024-01-01T12:00:00Z'),
      ],
      checkpointsHasMore: false,
    });

    expect(rowLabels(result.rows)).toEqual([
      'checkpoint:3',
      'event:2024-01-01T12:00:30.000Z',
      'checkpoint:1',
    ]);
    expect(result.canLoadMore).toBe(false);
    expect(result.fetchMoreEvents).toBe(false);
    expect(result.fetchMoreCheckpoints).toBe(false);
  });

  it('holds back older dense-event rows until checkpoints catch up', () => {
    // Events denser and older than the checkpoint page frontier (oldest cp = 12:01).
    const result = mergeHistoryBuffers({
      events: [
        event('2024-01-01T12:03:00Z'),
        event('2024-01-01T12:02:00Z'),
        event('2024-01-01T12:00:00Z'),
      ],
      eventsHasMore: false,
      checkpoints: [ checkpoint(5, '2024-01-01T12:01:00Z') ],
      checkpointsHasMore: true,
    });

    expect(rowLabels(result.rows)).toEqual([
      'event:2024-01-01T12:03:00.000Z',
      'event:2024-01-01T12:02:00.000Z',
      'checkpoint:5',
    ]);
    expect(result.canLoadMore).toBe(true);
    expect(result.fetchMoreEvents).toBe(false);
    expect(result.fetchMoreCheckpoints).toBe(true);
  });

  it('holds back older dense-checkpoint rows until events catch up', () => {
    const result = mergeHistoryBuffers({
      events: [ event('2024-01-01T12:01:00Z') ],
      eventsHasMore: true,
      checkpoints: [
        checkpoint(9, '2024-01-01T12:03:00Z'),
        checkpoint(7, '2024-01-01T12:02:00Z'),
        checkpoint(1, '2024-01-01T12:00:00Z'),
      ],
      checkpointsHasMore: false,
    });

    expect(rowLabels(result.rows)).toEqual([
      'checkpoint:9',
      'checkpoint:7',
      'event:2024-01-01T12:01:00.000Z',
    ]);
    expect(result.canLoadMore).toBe(true);
    expect(result.fetchMoreEvents).toBe(true);
    expect(result.fetchMoreCheckpoints).toBe(false);
  });

  it('asks both streams when their oldest times share the watermark', () => {
    const result = mergeHistoryBuffers({
      events: [
        event('2024-01-01T12:02:00Z'),
        event('2024-01-01T12:00:00Z'),
      ],
      eventsHasMore: true,
      checkpoints: [
        checkpoint(4, '2024-01-01T12:01:00Z'),
        checkpoint(2, '2024-01-01T12:00:00Z'),
      ],
      checkpointsHasMore: true,
    });

    expect(rowLabels(result.rows)).toEqual([
      'event:2024-01-01T12:02:00.000Z',
      'checkpoint:4',
      'checkpoint:2',
      'event:2024-01-01T12:00:00.000Z',
    ]);
    expect(result.canLoadMore).toBe(true);
    expect(result.fetchMoreEvents).toBe(true);
    expect(result.fetchMoreCheckpoints).toBe(true);
  });

  it('can load more when only one stream still has pages, even if buffers are empty', () => {
    const result = mergeHistoryBuffers({
      events: [],
      eventsHasMore: true,
      checkpoints: [],
      checkpointsHasMore: false,
    });

    expect(result.rows).toEqual([]);
    expect(result.canLoadMore).toBe(true);
    expect(result.fetchMoreEvents).toBe(true);
    expect(result.fetchMoreCheckpoints).toBe(false);
  });
});
