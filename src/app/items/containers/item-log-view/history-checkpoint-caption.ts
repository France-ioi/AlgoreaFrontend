import { TaskHistoryElement } from 'src/app/items/api/types';
import { HistoryListCheckpointRow } from './history-list-merge';

/** Kind, language, and file. The character counts are rendered beside this lead. */
export interface HistoryRowCaption {
  lead: string,
  added: number,
  removed: number,
}

/**
 * Tasks send "Untitled" or "Undefined" when the active tab has no file name.
 * Those placeholders are not a file, so the caption leaves the slot out.
 */
const unnamedTabNames = new Set([ 'untitled', 'undefined' ]);

function tabFileName(name: string | null): string | null {
  const trimmed = name?.trim() ?? '';
  if (trimmed === '' || unnamedTabNames.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function captionLead(kind: string, lang: string, file: string | null): string {
  return [ kind, lang, file ].filter((part): part is string => !!part).join(' · ');
}

/**
 * Counts are relative to the history element shown on the row below: the previous checkpoint
 * while the span is closed, the newest edit of the span once it is open.
 */
export function checkpointCaption(row: HistoryListCheckpointRow, expanded: boolean): HistoryRowCaption {
  const { tags, activeTab, sinceEarlierCheckpoint, sinceEarlier } = row.checkpoint;
  const tag = tags.map(t => t.i18nText ?? t.identifier).filter(Boolean).join(', ') || $localize`Checkpoint`;
  const delta = expanded ? sinceEarlier : sinceEarlierCheckpoint ?? sinceEarlier;
  return {
    lead: captionLead(tag, activeTab.progLang, tabFileName(activeTab.name)),
    added: delta.charsAdded,
    removed: delta.charsRemoved,
  };
}

export function editCaption(element: TaskHistoryElement): HistoryRowCaption {
  const { charsAdded, charsRemoved } = element.sinceEarlier;
  return {
    lead: captionLead($localize`Edit`, element.activeTab.progLang, tabFileName(element.activeTab.name)),
    added: charsAdded,
    removed: charsRemoved,
  };
}
