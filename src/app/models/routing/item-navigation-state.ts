
import { AnswerId } from 'src/app/models/ids';
import { Directive, inject, Input, OnChanges } from '@angular/core';
import { isString } from 'src/app/utils/type-checkers';
import { RouterLink } from '@angular/router';

export interface ItemNavigationState {
  preventFullFrame?: boolean,
  loadAnswerIdAsCurrent?: AnswerId,
}

/**
 * Set the `loadAnswerIdAsCurrent` property in the router state
 */
@Directive({ selector: '[algLoadAnswerAsCurrent]', standalone: true })
export class LoadAnswerAsCurrentDirective implements OnChanges {
  @Input('algLoadAnswerAsCurrent') answerId?: AnswerId;
  private routerLink = inject(RouterLink);

  ngOnChanges(): void {
    const routerLinkState = this.routerLink.state || {};
    this.routerLink.state = { ...routerLinkState, loadAnswerIdAsCurrent: this.answerId };
  }
}

export function loadAnswerAsCurrentFromNavigationState(): AnswerId|undefined {
  const state = history.state as unknown;
  if (typeof state !== 'object' || state === null || !('loadAnswerIdAsCurrent' in state)) return undefined;
  return isString(state.loadAnswerIdAsCurrent) ? state.loadAnswerIdAsCurrent : undefined;
}

