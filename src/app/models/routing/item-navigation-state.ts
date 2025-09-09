
import { AnswerId } from 'src/app/models/ids';
import { Directive, inject, Input, OnInit } from '@angular/core';
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
export class LoadAnswerAsCurrentDirective implements OnInit {
  @Input('algLoadAnswerAsCurrent') answerId?: AnswerId;
  private routerLink = inject(RouterLink);

  ngOnInit(): void {
    if (this.answerId) {
      const prevState = this.routerLink.state || {};
      this.routerLink.state = { ...prevState, loadAnswerIdAsCurrent: this.answerId };
    }
  }
}

export function loadAnswerAsCurrentFromNavigationState(): AnswerId|undefined {
  const state = history.state as unknown;
  if (typeof state !== 'object' || state === null || !('loadAnswerIdAsCurrent' in state)) return undefined;
  return isString(state.loadAnswerIdAsCurrent) ? state.loadAnswerIdAsCurrent : undefined;
}

