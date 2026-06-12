
import { AnswerId } from 'src/app/models/ids';
import { Directive, effect, inject, input } from '@angular/core';
import { isString } from 'src/app/utils/type-checkers';
import { RouterLink } from '@angular/router';

export interface ItemNavigationState {
  preventFullFrame?: boolean,
  loadAnswerIdAsCurrent?: AnswerId,
}

/**
 * Set the `loadAnswerIdAsCurrent` property in the router state
 */
@Directive({ selector: '[algLoadAnswerAsCurrent]' })
export class LoadAnswerAsCurrentDirective {
  answerId = input<AnswerId | undefined>(undefined, { alias: 'algLoadAnswerAsCurrent' });
  private routerLink = inject(RouterLink);

  constructor() {
    effect(() => {
      const routerLinkState = this.routerLink.state || {};
      // Intentionally mutates RouterLink state so navigation carries loadAnswerIdAsCurrent.
      this.routerLink.state = { ...routerLinkState, loadAnswerIdAsCurrent: this.answerId() };
    });
  }
}

export function loadAnswerAsCurrentFromNavigationState(): AnswerId|undefined {
  const state = history.state as unknown;
  if (typeof state !== 'object' || state === null || !('loadAnswerIdAsCurrent' in state)) return undefined;
  return isString(state.loadAnswerIdAsCurrent) ? state.loadAnswerIdAsCurrent : undefined;
}

