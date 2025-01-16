import { Pipe, PipeTransform } from '@angular/core';
import { AnswerId } from 'src/app/models/ids';
import { isString } from 'src/app/utils/type-checkers';

/**
 * Routing state to pass information that task should load a specific answer as the current answer
 */

interface LoadAnswerAsCurrentState {
  loadAnswerIdAsCurrent: AnswerId,
}

export function loadAnswerAsCurrentAsBrowserState(answerId: AnswerId): LoadAnswerAsCurrentState {
  return { loadAnswerIdAsCurrent: answerId };
}

@Pipe({ name: 'routingStateForLoadingAnswerAsCurrent', pure: true, standalone: true })
export class LoadAnswerAsCurrentRoutingStatePipe implements PipeTransform {
  transform(answerId: AnswerId): LoadAnswerAsCurrentState {
    return loadAnswerAsCurrentAsBrowserState(answerId);
  }
}

export function loadAnswerAsCurrentFromBrowserState(): AnswerId|undefined {
  const state = history.state as unknown;
  if (typeof state !== 'object' || state === null || !('loadAnswerIdAsCurrent' in state)) return undefined;
  return isString(state.loadAnswerIdAsCurrent) ? state.loadAnswerIdAsCurrent : undefined;
}
