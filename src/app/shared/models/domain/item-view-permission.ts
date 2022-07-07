import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

// short versions, not for export
const
  NONE = 'none',
  INFO = 'info',
  CONTENT = 'content',
  CONTENT_WITH_DESCENDANTS = 'content_with_descendants',
  SOLUTION = 'solution';

export const
  ITEMVIEWPERM_NONE = NONE,
  ITEMVIEWPERM_INFO = INFO,
  ITEMVIEWPERM_CONTENT = CONTENT,
  ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS = CONTENT_WITH_DESCENDANTS,
  ITEMVIEWPERM_SOLUTION = SOLUTION,
  ITEMVIEWPERM_MAX = SOLUTION;

export const itemViewPermValues = [ NONE, INFO, CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION ] as const;
export const itemViewPermDecoder = D.struct({
  canView: D.literal(...itemViewPermValues)
});
export type ItemViewPerm = D.TypeOf<typeof itemViewPermDecoder>;
export interface ItemWithViewPerm { permissions: ItemViewPerm }

/**
 * Permission required for listing the title of an item
 */
export function allowsViewingInfo(p: ItemViewPerm): boolean {
  return [ INFO, CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION ].includes(p.canView);
}

/**
 * Permission required for starting an attempt and so, for a
 * - task, to load the task itself
 * - chapter/skill, to list its children
 */
export function allowsViewingContent(p: ItemViewPerm): boolean {
  return [ CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION ].includes(p.canView);
}

/**
 * Permission required for viewing content + children (under propagation conditions) + view item solution
 * Note that users are also allowed to view solution if they have validated the item
 * (more info in devdoc)
 */
export function allowsViewingSolution(p: ItemViewPerm): boolean {
  return p.canView === SOLUTION;
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

@Pipe({ name: 'allowsViewingInfo', pure: true })
export class AllowsViewingItemInfoPipe implements PipeTransform {
  transform = allowsViewingInfo;
}
@Pipe({ name: 'allowsViewingContent', pure: true })
export class AllowsViewingItemContentPipe implements PipeTransform {
  transform = allowsViewingContent;
}
