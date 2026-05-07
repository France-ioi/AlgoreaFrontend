import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { routerNavigatedAction } from '@ngrx/router-store';
import { filter, map, skip, switchMap, take } from 'rxjs';
import { backLinkActions, sourcePageActions } from './back-link.actions';
import { itemContentStore } from '../item-content/item-content.store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

/**
 * Clear the stored back link when the user moves away from the destination
 * content (the page that the back link is meant to "return from").
 *
 * Implementation: each `registerBackLink` action waits for ONE
 * `routerNavigatedAction` (the click's own navigation that lands on the
 * destination), then watches `selectActiveContentIdentifier` for the next
 * *change* to a different (item id, observed-group id) pair. The destination's
 * identifier is captured as the first emission after the click's navigation;
 * we skip it and clear on the next emission.
 *
 * The `routerNavigatedAction` gate is needed because, without it, the watch
 * would start on the source page and the very next emission would be the
 * destination's identifier, triggering an immediate clear before the user can
 * use the back-link.
 */
export const clearBackLinkEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
  ) => actions$.pipe(
    ofType(sourcePageActions.registerBackLink),
    switchMap(() => actions$.pipe(
      // skip until the first navigation that actually changes the path
      ofType(routerNavigatedAction),
      take(1),
      // clear when the active content identifier changes
      switchMap(() => store$.select(itemContentStore.selectActiveContentIdentifier).pipe(
        filter(isNotNull),
        skip(1),
        take(1),
        map(() => backLinkActions.clear()),
      )),
    )),
  ),
  { functional: true },
);
