import { checkpointEditQuery, HistoryDisplayRow, insertExpandedEdits } from './history-list-edits';
import { HistoryListRow } from './history-list-merge';
import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { TaskHistoryElement } from 'src/app/items/api/types';

function event(at: string): ActivityLogs[number] {
  return {
    activityType: 'submission',
    at: new Date(at),
    attemptId: '0',
    item: { id: '1', string: { title: 'Task' }, type: 'Task' },
    participant: { id: 'u1', name: 'user', type: 'User' },
    answerId: 'ans-1',
    score: 80,
  };
}

function element(
  id: number,
  datetime: string,
  isCheckpoint: boolean,
  elementsCount = 0,
): TaskHistoryElement {
  return {
    id,
    datetime,
    tags: [{ identifier: isCheckpoint ? 'cp' : 'edit', i18nText: isCheckpoint ? 'Checkpoint' : 'Edit' }],
    idUser: 'u1',
    isCheckpoint,
    sinceEarlier: { charsAdded: 10, charsRemoved: 1 },
    ...(isCheckpoint ? { sinceEarlierCheckpoint: { charsAdded: 10, charsRemoved: 1, elementsCount } } : {}),
    activeTab: { name: 'main.py', length: 20, progLang: 'python' },
  };
}

function labels(rows: HistoryDisplayRow[]): string[] {
  return rows.map(row => {
    if (row.kind === 'checkpoint') return `checkpoint:${row.checkpoint.id}`;
    if (row.kind === 'edit') return `edit:${row.edit.id}`;
    return `event:${row.event.activityType}`;
  });
}

describe('checkpointEditQuery', () => {
  const newer = element(3, '2024-01-01T12:02:00Z', true, 1);
  const older = element(1, '2024-01-01T12:00:00Z', true, 0);
  const rows: HistoryListRow[] = [
    { kind: 'checkpoint', at: new Date(newer.datetime), checkpoint: newer },
    { kind: 'event', at: new Date('2024-01-01T12:01:30Z'), event: event('2024-01-01T12:01:30Z') },
    { kind: 'checkpoint', at: new Date(older.datetime), checkpoint: older },
  ];

  it('asks for edits after the previous checkpoint id up to this checkpoint id', () => {
    expect(checkpointEditQuery(newer, rows)).toEqual({ minId: 1, maxId: 3, limit: 2 });
  });

  it('omits minId when this checkpoint is the oldest one shown', () => {
    expect(checkpointEditQuery(older, rows)).toEqual({ maxId: 1, limit: 1 });
  });
});

describe('insertExpandedEdits', () => {
  it('inserts edits under a checkpoint in time order, keeping a submission in its slot', () => {
    const newer = element(3, '2024-01-01T12:02:00Z', true, 1);
    const older = element(1, '2024-01-01T12:00:00Z', true, 0);
    const edit = element(2, '2024-01-01T12:01:00Z', false);
    const rows: HistoryListRow[] = [
      { kind: 'checkpoint', at: new Date(newer.datetime), checkpoint: newer },
      { kind: 'event', at: new Date('2024-01-01T12:01:30Z'), event: event('2024-01-01T12:01:30Z') },
      { kind: 'checkpoint', at: new Date(older.datetime), checkpoint: older },
    ];

    const expanded = insertExpandedEdits(rows, new Map([[ 3, [ newer, edit ] ]]));

    expect(labels(expanded)).toEqual([
      'checkpoint:3',
      'event:submission',
      'edit:2',
      'checkpoint:1',
    ]);
  });

  it('drops edits when that checkpoint is no longer expanded', () => {
    const checkpoint = element(3, '2024-01-01T12:02:00Z', true, 1);
    const rows: HistoryListRow[] = [
      { kind: 'checkpoint', at: new Date(checkpoint.datetime), checkpoint },
    ];

    expect(insertExpandedEdits(rows, new Map())).toEqual(rows);
  });

  it('places a checkpoint above an edit above an event at the same second', () => {
    const at = '2024-01-01T12:00:00Z';
    const checkpoint = element(3, at, true, 1);
    const edit = element(2, at, false);
    const rows: HistoryListRow[] = [
      { kind: 'checkpoint', at: new Date(at), checkpoint },
      { kind: 'event', at: new Date(at), event: event(at) },
    ];

    expect(labels(insertExpandedEdits(rows, new Map([[ 3, [ edit ] ]])))).toEqual([
      'checkpoint:3',
      'edit:2',
      'event:submission',
    ]);
  });
});
