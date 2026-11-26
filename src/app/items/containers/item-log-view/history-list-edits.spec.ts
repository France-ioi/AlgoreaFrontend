import { checkpointEditQuery, editSpanLine, HistoryDisplayRow, insertExpandedEdits } from './history-list-edits';
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
});

describe('editSpanLine', () => {
  it('draws a stem on the open checkpoint and a line through the last edit, including a submission between the edits', () => {
    const newer = element(3, '2024-01-01T12:03:00Z', true, 2);
    const older = element(1, '2024-01-01T12:00:00Z', true, 0);
    const editA = element(4, '2024-01-01T12:02:00Z', false);
    const editB = element(2, '2024-01-01T12:01:00Z', false);
    const rows: HistoryListRow[] = [
      { kind: 'checkpoint', at: new Date(newer.datetime), checkpoint: newer },
      { kind: 'event', at: new Date('2024-01-01T12:01:30Z'), event: event('2024-01-01T12:01:30Z') },
      { kind: 'checkpoint', at: new Date(older.datetime), checkpoint: older },
      { kind: 'event', at: new Date('2024-01-01T11:00:00Z'), event: event('2024-01-01T11:00:00Z') },
    ];
    const expanded = insertExpandedEdits(rows, new Map([[ 3, [ newer, editA, editB ] ]]));

    expect(labels(expanded)).toEqual([
      'checkpoint:3',
      'edit:4',
      'event:submission',
      'edit:2',
      'checkpoint:1',
      'event:submission',
    ]);
    expect(editSpanLine(expanded)).toEqual([ 'stem', 'line', 'line', 'end', 'none', 'none' ]);
  });

  it('keeps each open checkpoint on its own stretch', () => {
    const newer = element(5, '2024-01-01T12:04:00Z', true, 1);
    const older = element(2, '2024-01-01T12:02:00Z', true, 1);
    const editNewer = element(4, '2024-01-01T12:03:00Z', false);
    const editOlder = element(1, '2024-01-01T12:01:00Z', false);
    const rows: HistoryListRow[] = [
      { kind: 'checkpoint', at: new Date(newer.datetime), checkpoint: newer },
      { kind: 'checkpoint', at: new Date(older.datetime), checkpoint: older },
      { kind: 'event', at: new Date('2024-01-01T11:00:00Z'), event: event('2024-01-01T11:00:00Z') },
    ];
    const expanded = insertExpandedEdits(rows, new Map([
      [ 5, [ newer, editNewer ] ],
      [ 2, [ older, editOlder ] ],
    ]));

    expect(editSpanLine(expanded)).toEqual([ 'stem', 'end', 'stem', 'end', 'none' ]);
  });

  it('draws nothing while a checkpoint is collapsed', () => {
    const checkpoint = element(3, '2024-01-01T12:02:00Z', true, 2);
    const rows: HistoryDisplayRow[] = [
      { kind: 'checkpoint', at: new Date(checkpoint.datetime), checkpoint },
      { kind: 'event', at: new Date('2024-01-01T12:01:00Z'), event: event('2024-01-01T12:01:00Z') },
    ];

    expect(editSpanLine(rows)).toEqual([ 'none', 'none' ]);
  });
});

describe('same-second ordering', () => {
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
