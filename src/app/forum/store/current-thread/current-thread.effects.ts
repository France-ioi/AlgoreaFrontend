import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { EMPTY, tap, withLatestFrom } from 'rxjs';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { Store } from '@ngrx/store';
import { fromForum } from '../forum.feature';
import { areSameThreads } from '../../models/threads';
import { APPCONFIG } from 'src/app/config';

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
