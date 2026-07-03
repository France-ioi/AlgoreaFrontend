import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { EMPTY, tap, withLatestFrom } from 'rxjs';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { areSameThreads } from '../../models/threads';
import { APPCONFIG } from 'src/app/config';
import { reportAnError } from 'src/app/utils/error-handling/error-reporting';

export const fetchStateChangeGuardEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ? actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChanged),
    withLatestFrom(store$.select(fromForum.selectThreadId)),
    // report instead of throw: throwing here would kill the effect stream permanently
    tap(([{ fetchState } , id ]) => {
      if (id === null) {
        reportAnError(new Error('unexpected: no state id while changing thread info'));
        return;
      }
      if (fetchState.data && !areSameThreads(id, fetchState.data)) {
        reportAnError(new Error('unexpected: fetch state thread <> state id'));
      }
    }),
  ) : EMPTY),
  { functional: true, dispatch: false }
);
