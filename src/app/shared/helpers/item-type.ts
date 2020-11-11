
export type ItemType = 'Chapter'|'Task'|'Course'|'Skill';
export type ItemTypeCategory = 'activity'|'skill';

/* Helpers in Item-like */
export function isASkill(item: { type: ItemType }): boolean {
  return item.type === 'Skill';
}

/* Helpers on ItemTypeCategory */
export function isSkill(cat: ItemTypeCategory): cat is 'skill' {
  return cat === 'skill';
}


