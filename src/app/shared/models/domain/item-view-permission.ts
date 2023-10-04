import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

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
export const itemViewPermDecoder = D.struct({
  canView: D.literal(...itemViewPermValues)
});
export type ItemPermWithView = D.TypeOf<typeof itemViewPermDecoder>;
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

/**
 * Permission required for viewing content + children (under propagation conditions) + view item solution
 * Note that users are also allowed to view solution if they have validated the item
 * (more info in devdoc)
 */
export function allowsViewingSolution(p: ItemPermWithView): boolean {
  return p.canView === P.Solution;
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

export function canCurrentUserViewSolution(i: ItemWithViewPerm, result?: { validated: boolean }): boolean {
  return allowsViewingSolution(i.permissions) || !!result?.validated;
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
