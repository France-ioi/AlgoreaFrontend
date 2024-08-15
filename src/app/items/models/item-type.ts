import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export const itemTypeSchema = z.enum([ 'Chapter', 'Task', 'Skill' ]);

export type ActivityType = 'Chapter'|'Task';
export type ItemType = z.infer<typeof itemTypeSchema>;
export type ItemTypeCategory = 'activity'|'skill';
interface ItemWithType { type: ItemType }


/* Helpers in Item-like */
export function isASkill(item: ItemWithType): boolean {
  return item.type === 'Skill';
}

export function isATask(item: ItemWithType): boolean {
  return item.type === 'Task';
}

export function isAChapter(item: ItemWithType): boolean {
  return item.type === 'Chapter';
}

export function mayHaveChildren(item: ItemWithType): boolean {
  return item.type === 'Chapter' || item.type === 'Skill';
}

export function typeCategoryOfItem(item: ItemWithType): ItemTypeCategory {
  return item.type === 'Skill' ? 'skill' : 'activity';
}

export function isAnActivity(item: ItemWithType): boolean {
  return typeCategoryOfItem(item) === 'activity';
}

/* Helpers on ItemTypeCategory */
export function isSkill(cat: ItemTypeCategory): cat is 'skill' {
  return cat === 'skill';
}

export function isTask(item: ItemWithType): boolean {
  return item.type === 'Task';
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'isASkill', pure: true,
  standalone: true
})
export class IsASkillPipe implements PipeTransform {
  transform = isASkill;
}

@Pipe({
  name: 'isATask', pure: true,
  standalone: true
})
export class IsATaskPipe implements PipeTransform {
  transform = isATask;
}

@Pipe({
  name: 'isAChapter', pure: true,
  standalone: true
})
export class IsAChapterPipe implements PipeTransform {
  transform = isAChapter;
}

@Pipe({
  name: 'mayHaveChildren', pure: true,
  standalone: true
})
export class MayHaveChildrenPipe implements PipeTransform {
  transform = mayHaveChildren;
}
