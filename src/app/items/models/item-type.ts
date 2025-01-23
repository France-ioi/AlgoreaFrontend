import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export enum ItemType {
  Chapter = 'Chapter',
  Task = 'Task',
  Skill = 'Skill',
}
export type ItemTypeString = `${ItemType}`;
export type ActivityType = ItemType.Chapter | ItemType.Task;
export enum ItemTypeCategory {
  Activity = 'activity',
  Skill = 'skill',
}
export type ItemTypeCategoryString = `${ItemTypeCategory}`;

export const itemTypeSchema = z.nativeEnum(ItemType);
interface ItemWithType { type: ItemType }

/* Helpers in Item-like */
export function isASkill(item: ItemWithType): boolean {
  return item.type === ItemType.Skill;
}

export function isATask(item: ItemWithType): boolean {
  return item.type === ItemType.Task;
}

export function isAChapter(item: ItemWithType): boolean {
  return item.type === ItemType.Chapter;
}

export function mayHaveChildren(item: ItemWithType): boolean {
  return item.type === ItemType.Chapter || item.type === ItemType.Skill;
}

export function typeCategoryOfItem(item: ItemWithType): ItemTypeCategory {
  return item.type === ItemType.Skill ? ItemTypeCategory.Skill : ItemTypeCategory.Activity;
}

export function isAnActivity(item: ItemWithType): boolean {
  return typeCategoryOfItem(item) === ItemTypeCategory.Activity;
}

export function itemType(type: ItemTypeString): ItemType {
  if (type === 'Chapter') return ItemType.Chapter;
  if (type === 'Task') return ItemType.Task;
  return ItemType.Skill;
}

/* Helpers on ItemTypeCategory */
export function isSkill(cat: ItemTypeCategory): cat is ItemTypeCategory.Skill {
  return cat === ItemTypeCategory.Skill;
}

export function itemTypeCategory(category: ItemTypeCategoryString): ItemTypeCategory {
  return category === ItemTypeCategory.Activity.toString() ? ItemTypeCategory.Activity : ItemTypeCategory.Skill;
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
