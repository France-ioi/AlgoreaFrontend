import { TaskHistoryElement } from 'src/app/items/api/types';
import { HistoryListCheckpointRow } from './history-list-merge';

export function checkpointCaption(row: HistoryListCheckpointRow): string {
  const { tags, activeTab, sinceEarlierCheckpoint, sinceEarlier } = row.checkpoint;
  const tag = tags.map(t => t.i18nText ?? t.identifier).filter(Boolean).join(', ') || $localize`Checkpoint`;
  const file = activeTab.name ?? $localize`Untitled`;
  const delta = sinceEarlierCheckpoint ?? sinceEarlier;
  return $localize`${tag}:tag: · ${activeTab.progLang}:lang: · ${file}:file: · +${
    delta.charsAdded
  }:added:/−${delta.charsRemoved}:removed:`;
}

export function editCaption(element: TaskHistoryElement): string {
  const file = element.activeTab.name ?? $localize`Untitled`;
  const { charsAdded, charsRemoved } = element.sinceEarlier;
  return $localize`Edit · +${charsAdded}:added:/−${charsRemoved}:removed: · ${element.activeTab.progLang}:lang: · ${file}:file:`;
}
