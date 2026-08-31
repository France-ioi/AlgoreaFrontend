import { isATask } from 'src/app/items/models/item-type';
import { ItemChildWithAdditions } from '../item-children-list/item-children';

/** Consecutive L1 tasks share one grid; Chapter/Skill each get an h2 + nested grid section. */
export type TwoLevelsSection =
  | { kind: 'tasks', items: ItemChildWithAdditions[] }
  | { kind: 'container', item: ItemChildWithAdditions };

export function groupTwoLevelsSections(children: ItemChildWithAdditions[]): TwoLevelsSection[] {
  const sections: TwoLevelsSection[] = [];

  for (const child of children) {
    if (isATask(child)) {
      const last = sections.at(-1);
      if (last?.kind === 'tasks') {
        last.items.push(child);
      } else {
        sections.push({ kind: 'tasks', items: [ child ] });
      }
      continue;
    }
    sections.push({ kind: 'container', item: child });
  }

  return sections;
}

export function twoLevelsSectionTrackId(section: TwoLevelsSection): string {
  return section.kind === 'tasks'
    ? `tasks:${section.items.map(item => item.id).join(',')}`
    : `container:${section.item.id}`;
}
