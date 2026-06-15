import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export enum ItemViewPerm {
  None = 'none',
  Info = 'info',
  Content = 'content',
  ContentWithDescendants = 'content_with_descendants',
  Solution = 'solution',
}
export const itemViewPermMax = ItemViewPerm.Solution;
const P = ItemViewPerm; // non-exported shorthand

export const itemViewPermValues = [ P.None, P.Info, P.Content, P.ContentWithDescendants, P.Solution ] as const;
export const itemViewPermSchema = z.object({
  canView: z.enum(itemViewPermValues)
});
export type ItemPermWithView = z.infer<typeof itemViewPermSchema>;
export interface ItemWithViewPerm { permissions: ItemPermWithView }

/**
 * Permission required for listing the title of an item
 */
export function allowsViewingInfo(p: ItemPermWithView): boolean {
  return [ P.Info, P.Content, P.ContentWithDescendants, P.Solution ].includes(p.canView);
}
/**
 * Permission required for starting an attempt and so, for a
 * - task, to load the task itself
 * - chapter/skill, to list its children
 */
export function allowsViewingContent(p: ItemPermWithView): boolean {
  return [ P.Content, P.ContentWithDescendants, P.Solution ].includes(p.canView);
}

// ********************************************
// Shortcut/helper functions on items directly
// ********************************************

export function canCurrentUserViewInfo(i: ItemWithViewPerm): boolean {
  return allowsViewingInfo(i.permissions);
}

export function canCurrentUserViewContent(i: ItemWithViewPerm): boolean {
  return allowsViewingContent(i.permissions);
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'allowsViewingInfo', pure: true,
  standalone: true
})
export class AllowsViewingItemInfoPipe implements PipeTransform {
  transform = allowsViewingInfo;
}
@Pipe({
  name: 'allowsViewingContent', pure: true,
  standalone: true
})
export class AllowsViewingItemContentPipe implements PipeTransform {
  transform = allowsViewingContent;
}
