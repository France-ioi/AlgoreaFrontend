import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map, skip, switchMap, take } from 'rxjs';
import { itemContentStore } from '../item-content/item-content.store';
import { answerBackLinkActions, sourcePageActions } from './answer-back-link.actions';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

/**
 * Clear the stored answer back link when the active content item ID changes
 * AFTER the initial navigation triggered by the "View answer" click.
 * Each `registerAnswerBackLink` action starts watching for item changes,
 * skipping the immediate value and the navigation triggered by the click (skip 2),
 * then clearing on the next real item change.
 * `switchMap` cancels the previous watcher if the action fires again.
 */
export const clearAnswerBackLinkOnItemChangeEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
  ) => actions$.pipe(
    ofType(sourcePageActions.registerAnswerBackLink),
    switchMap(() => store$.select(itemContentStore.selectActiveContentId).pipe(
      filter(isNotNull),
      distinctUntilChanged(),
      skip(2),
      take(1),
      map(() => answerBackLinkActions.clear()),
    )),
  ),
  { functional: true },
);
