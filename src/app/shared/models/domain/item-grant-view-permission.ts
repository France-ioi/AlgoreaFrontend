import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

// short versions, not for export
const
  NONE = 'none',
  ENTER = 'enter',
  CONTENT = 'content',
  CONTENT_WITH_DESCENDANTS = 'content_with_descendants',
  SOLUTION = 'solution',
  SOLUTION_WITH_GRANT = 'solution_with_grant';

export const
  ITEMGRANTVIEWPERM_NONE = NONE,
  ITEMGRANTVIEWPERM_ENTER = ENTER,
  ITEMGRANTVIEWPERM_CONTENT = CONTENT,
  ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS = CONTENT_WITH_DESCENDANTS,
  ITEMGRANTVIEWPERM_SOLUTION = SOLUTION,
  ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT = SOLUTION_WITH_GRANT,
  ITEMGRANTVIEWPERM_MAX = SOLUTION_WITH_GRANT;

export const itemGrantViewPermValues = [ NONE, ENTER, CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION, SOLUTION_WITH_GRANT ] as const;
export const itemGrantViewPermDecoder = D.struct({
  canGrantView: D.literal(...itemGrantViewPermValues)
});
export type ItemGrantViewPerm = D.TypeOf<typeof itemGrantViewPermDecoder>;
export interface ItemWithGrantViewPerm { permissions: ItemGrantViewPerm }

export function allowsGrantingView(p: ItemGrantViewPerm): boolean {
  return [ ENTER, CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION, SOLUTION_WITH_GRANT ].includes(p.canGrantView);
}

export function allowsGrantingContentView(p: ItemGrantViewPerm): boolean {
  return [ CONTENT, CONTENT_WITH_DESCENDANTS, SOLUTION, SOLUTION_WITH_GRANT ].includes(p.canGrantView);
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({ name: 'allowsGrantingView', pure: true })
export class AllowsGrantingViewItemPipe implements PipeTransform {
  transform = allowsGrantingView;
}
@Pipe({ name: 'allowsGrantingContentView', pure: true })
export class AllowsGrantingContentViewItemPipe implements PipeTransform {
  transform = allowsGrantingContentView;
}
