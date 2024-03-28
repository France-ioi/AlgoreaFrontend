import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { fromItemContent } from './item-content.store';
import { cleanupActions } from './item-content.actions';

/**
 * In order to avoid keeping `answer` (that may be large) into the store when not used anymore, we clear it
 */
export const cleanUpAnswerEffect = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(fromItemContent.selectAnswer).pipe(
    filter(answer => answer === null), // becomes null when we are not anymore on a route with `fromStore` parameter
    map(() => cleanupActions.clearAnswer())
  ),
  { functional: true },
);
