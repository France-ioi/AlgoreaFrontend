import { TaskHistoryElement } from 'src/app/items/api/types';
import { checkpointCaption, editCaption } from './history-checkpoint-caption';
import { HistoryListCheckpointRow } from './history-list-merge';

function element(overrides: Partial<TaskHistoryElement> = {}): TaskHistoryElement {
  return {
    id: 1,
    datetime: '2024-01-01T00:00:00Z',
    tags: [{ identifier: 'manual', i18nText: 'Manual' }],
    idUser: 'u1',
    isCheckpoint: true,
    sinceEarlier: { charsAdded: 4, charsRemoved: 1 },
    sinceEarlierCheckpoint: { charsAdded: 23, charsRemoved: 3, elementsCount: 1 },
    activeTab: { name: 'main.py', length: 40, progLang: 'python' },
    ...overrides,
  };
}

function checkpointRow(checkpoint: TaskHistoryElement): HistoryListCheckpointRow {
  return { kind: 'checkpoint', at: new Date(checkpoint.datetime), checkpoint };
}

describe('checkpointCaption', () => {
  it('counts since the previous checkpoint while the span is closed', () => {
    expect(checkpointCaption(checkpointRow(element()), false)).toEqual({
      lead: 'Manual · python · main.py',
      added: 23,
      removed: 3,
    });
  });

  it('counts since the newest edit once the span is open', () => {
    expect(checkpointCaption(checkpointRow(element()), true)).toEqual({
      lead: 'Manual · python · main.py',
      added: 4,
      removed: 1,
    });
  });

  it('counts since the previous element when the checkpoint delta is missing', () => {
    const row = checkpointRow(element({ sinceEarlierCheckpoint: undefined }));
    expect(checkpointCaption(row, false)).toEqual(jasmine.objectContaining({ added: 4, removed: 1 }));
  });

  it('omits a missing, blank, or placeholder file name', () => {
    for (const name of [ null, '', '  ', 'Untitled', 'undefined', 'UNDEFINED' ]) {
      const row = checkpointRow(element({ activeTab: { name, length: 0, progLang: 'python' } }));
      expect(checkpointCaption(row, false).lead).toBe('Manual · python');
    }
  });

  it('falls back to Checkpoint when the task sent no tag text', () => {
    expect(checkpointCaption(checkpointRow(element({ tags: [] })), false).lead).toBe('Checkpoint · python · main.py');
  });
});

describe('editCaption', () => {
  it('uses the same order and counts since the previous element', () => {
    expect(editCaption(element({ isCheckpoint: false, tags: [] }))).toEqual({
      lead: 'Edit · python · main.py',
      added: 4,
      removed: 1,
    });
  });

  it('omits a placeholder file name', () => {
    const edit = element({ activeTab: { name: 'Undefined', length: 0, progLang: 'cpp' } });
    expect(editCaption(edit)).toEqual({ lead: 'Edit · cpp', added: 4, removed: 1 });
  });
});
