import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

// short versions, not for export
const
  NONE = 'none',
  RESULT = 'result',
  ANSWER = 'answer',
  ANSWER_WITH_GRANT = 'answer_with_grant';

export const
  ITEMWATCHPERM_NONE = NONE,
  ITEMWATCHPERM_RESULT = RESULT,
  ITEMWATCHPERM_ANSWER = ANSWER,
  ITEMWATCHPERM_ANSWER_WITH_GRANT = ANSWER_WITH_GRANT,
  ITEMWATCHPERM_MAX = ANSWER_WITH_GRANT;

export const itemWatchPermValues = [ NONE, RESULT, ANSWER, ANSWER_WITH_GRANT ] as const;
export const itemWatchPermDecoder = D.struct({
  canWatch: D.literal(...itemWatchPermValues)
});
export type ItemWatchPerm = D.TypeOf<typeof itemWatchPermDecoder>;
export interface ItemWithWatchPerm { permissions: ItemWatchPerm }

/**
 * Whether the permission allows the user/group to watch others' results (require perm on the receiver as well!)
 */
export function allowsWatchingResults(p: ItemWatchPerm): boolean {
  return [ RESULT, ANSWER, ANSWER_WITH_GRANT ].includes(p.canWatch);
}

/**
 * Whether the permission allows the user/group to watch others' results and answers (require perm on the receiver as well!)
 */
export function allowsWatchingAnswers(p: ItemWatchPerm): boolean {
  return [ ANSWER, ANSWER_WITH_GRANT ].includes(p.canWatch);
}

/**
 * Whether the permission allows the user/group to give watching permissions to others (require perm on the receiver as well!)
 */
export function allowsGrantingWatch(p: ItemWatchPerm): boolean {
  return p.canWatch === ANSWER_WITH_GRANT;
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({ name: 'allowsWatchingResults', pure: true })
export class AllowsWatchingItemResultsPipe implements PipeTransform {
  transform = allowsWatchingResults;
}
