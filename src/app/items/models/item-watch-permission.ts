import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export enum ItemWatchPerm {
  None = 'none',
  Result = 'result',
  Answer = 'answer',
  AnswerWithGrant = 'answer_with_grant',
}
export const itemWatchPermMax = ItemWatchPerm.AnswerWithGrant;
const P = ItemWatchPerm; // non-exported shorthand

export const itemWatchPermValues = [ P.None, P.Result, P.Answer, P.AnswerWithGrant ] as const;
export const itemWatchPermSchema = z.object({
  canWatch: z.enum(itemWatchPermValues)
});
export type ItemPermWithWatch = z.infer<typeof itemWatchPermSchema>;
export interface ItemWithWatchPerm { permissions: ItemPermWithWatch }

// Internal helpers — do NOT export. Use canCurrentUserWatchResult / canCurrentUserWatchAnswers instead.
// Agents: keep these unexported; add or extend the canCurrentUser* wrappers for item-level checks.

/**
 * Whether the permission allows the user/group to watch others' results (require perm on the receiver as well!)
 */
function allowsWatchingResults(p: ItemPermWithWatch): boolean {
  return [ P.Result, P.Answer, P.AnswerWithGrant ].includes(p.canWatch);
}

/**
 * Whether the permission allows the user/group to watch others' results and answers (require perm on the receiver as well!)
 */
function allowsWatchingAnswers(p: ItemPermWithWatch): boolean {
  return [ P.Answer, P.AnswerWithGrant ].includes(p.canWatch);
}

/**
 * Whether the permission allows the user/group to give watching permissions to others (require perm on the receiver as well!)
 */
export function allowsGrantingWatch(p: ItemPermWithWatch): boolean {
  return p.canWatch === P.AnswerWithGrant;
}

// ********************************************
// Shortcut/helper functions on items directly
// ********************************************

export function canCurrentUserWatchResult(i: ItemWithWatchPerm): boolean {
  return allowsWatchingResults(i.permissions);
}

export function canCurrentUserWatchAnswers(i: ItemWithWatchPerm): boolean {
  return allowsWatchingAnswers(i.permissions);
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'allowsWatchingResults', pure: true
})
export class AllowsWatchingItemResultsPipe implements PipeTransform {
  transform = allowsWatchingResults;
}

@Pipe({
  name: 'allowsWatchingAnswers', pure: true
})
export class AllowsWatchingItemAnswersPipe implements PipeTransform {
  transform = allowsWatchingAnswers;
}
