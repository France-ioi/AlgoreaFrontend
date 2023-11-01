import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { tap, withLatestFrom } from 'rxjs';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { Store } from '@ngrx/store';
import forumFeature from '..';
import { areSameThreads } from '../../models/threads';

export const fetchStateChangeGuardEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
  ) => actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChange),
    withLatestFrom(store$.select(forumFeature.selectThreadId)),
    tap(([{ fetchState } , id ]) => {
      if (id === null) throw new Error('unexpected: no state id while changing thread info');
      if (fetchState.data && !areSameThreads(id, fetchState.data)) throw new Error('unexpected: fetch state thread <> state id');
    }),
  ),
  { functional: true, dispatch: false }
);
