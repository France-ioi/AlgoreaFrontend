import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

// domain level item typing
export const itemTypeSchema = z.enum([ 'Chapter', 'Task', 'Skill' ]);
export type ItemType = z.infer<typeof itemTypeSchema>;
export const itemTypeEnum = itemTypeSchema.enum;

// activity is just a subset of type just including chapter and task
const activityTypeSchema = itemTypeSchema.extract([ 'Chapter', 'Task' ]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

// another higher level of item typing: chapters and tasks are activities, skill are skills
const itemTypeCategorySchema = z.enum([ 'activity', 'skill' ]);
export type ItemTypeCategory = z.infer<typeof itemTypeCategorySchema>;
export const itemTypeCategoryEnum = itemTypeCategorySchema.enum;

// ********************************************
// Helpers for items-like
// ********************************************

interface ItemWithType { type: ItemType }
const t = itemTypeEnum; // local shorthand
const c = itemTypeCategoryEnum; // local shorthand

export function isASkill(item: ItemWithType): boolean {
  return item.type === t.Skill;
}

export function isATask(item: ItemWithType): boolean {
  return item.type === t.Task;
}

export function isAChapter(item: ItemWithType): boolean {
  return item.type === t.Chapter;
}

export function mayHaveChildren(item: ItemWithType): boolean {
  return item.type === t.Chapter || item.type === t.Skill;
}

export function typeCategoryOfItem(item: ItemWithType): ItemTypeCategory {
  return item.type === t.Skill ? c.skill : c.activity;
}

export function isAnActivity(item: ItemWithType): boolean {
  return typeCategoryOfItem(item) === 'activity';
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
