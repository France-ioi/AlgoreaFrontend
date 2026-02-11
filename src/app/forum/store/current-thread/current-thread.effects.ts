import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { distinctUntilChanged, EMPTY, filter, map, skip, switchMap, take, tap, withLatestFrom } from 'rxjs';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { threadPanelActions } from './current-thread.actions';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { fromItemContent } from 'src/app/items/store';
import { areSameThreads } from '../../models/threads';
import { APPCONFIG } from 'src/app/config';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const fetchStateChangeGuardEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ? actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChanged),
    withLatestFrom(store$.select(fromForum.selectThreadId)),
    tap(([{ fetchState } , id ]) => {
      if (id === null) throw new Error('unexpected: no state id while changing thread info');
      if (fetchState.data && !areSameThreads(id, fetchState.data)) throw new Error('unexpected: fetch state thread <> state id');
    }),
  ) : EMPTY),
  { functional: true, dispatch: false }
);

/**
 * Clear the stored "previous content route" when the active content item ID changes
 * AFTER the initial navigation triggered by the button.
 * Each `navigatedToThreadContent` action starts watching for item changes,
 * skipping the immediate value and the button-triggered navigation (skip 2),
 * then clearing on the next real item change.
 * `switchMap` cancels the previous watcher if the action fires again.
 */
export const clearPreviousContentOnItemChangeEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
  ) => actions$.pipe(
    ofType(threadPanelActions.navigatedToThreadContent),
    switchMap(() => store$.select(fromItemContent.selectActiveContentId).pipe(
      filter(isNotNull),
      distinctUntilChanged(),
      // skip(1): current value on subscription
      // skip(2): the navigation triggered by the button itself
      skip(2),
      take(1),
      map(() => threadPanelActions.clearPreviousContent()),
    )),
  ),
  { functional: true }
);
