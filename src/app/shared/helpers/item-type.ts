
export type ActivityType = 'Chapter'|'Task'|'Course';
export type ItemType = ActivityType|'Skill';
export type ItemTypeCategory = 'activity'|'skill';
interface ItemWithType { type: ItemType }

/* Helpers in Item-like */
export function isASkill(item: ItemWithType): boolean {
  return item.type === 'Skill';
}

export function isATask(item: ItemWithType): boolean {
  // courses are now considered the same way as tasks (both will be merged soon)
  return item.type === 'Task' || item.type === 'Course';
}

export function mayHaveChildren(item: ItemWithType): boolean {
  return item.type === 'Chapter' || item.type === 'Skill';
}

export function typeCategoryOfItem(item: ItemWithType): ItemTypeCategory {
  return item.type === 'Skill' ? 'skill' : 'activity';
}

/* Helpers on ItemTypeCategory */
export function isSkill(cat: ItemTypeCategory): cat is 'skill' {
  return cat === 'skill';
}

export function isTask(item: ItemWithType): boolean {
  return item.type === 'Task' || item.type === 'Course';
}
