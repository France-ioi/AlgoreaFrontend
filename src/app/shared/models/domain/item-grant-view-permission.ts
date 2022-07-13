import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

export enum ItemGrantViewPerm {
  None = 'none',
  Enter = 'enter',
  Content = 'content',
  ContentWithDescendants = 'content_with_descendants',
  Solution = 'solution',
  SolutionWithGrant = 'solution_with_grant',
}
export const itemGrantViewPermMax = ItemGrantViewPerm.SolutionWithGrant;

const P = ItemGrantViewPerm; // non-exported shorthand

export const itemGrantViewPermValues = [ P.None, P.Enter, P.Content, P.ContentWithDescendants, P.Solution, P.SolutionWithGrant ] as const;
export const itemGrantViewPermDecoder = D.struct({
  canGrantView: D.literal(...itemGrantViewPermValues)
});
export type ItemPermWithGrantView = D.TypeOf<typeof itemGrantViewPermDecoder>;
export interface ItemWithGrantViewPerm { permissions: ItemPermWithGrantView }

export function allowsGrantingView(p: ItemPermWithGrantView): boolean {
  return [ P.Enter, P.Content, P.ContentWithDescendants, P.Solution, P.SolutionWithGrant ].includes(p.canGrantView);
}

export function allowsGrantingContentView(p: ItemPermWithGrantView): boolean {
  return [ P.Content, P.ContentWithDescendants, P.Solution, P.SolutionWithGrant ].includes(p.canGrantView);
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
