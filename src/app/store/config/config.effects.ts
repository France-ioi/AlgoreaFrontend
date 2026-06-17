import { inject } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { map, take } from 'rxjs/operators';
import { configActions } from './config.actions';
import { APPCONFIG } from 'src/app/config';

export const loadConfigEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(ROOT_EFFECTS_INIT),
    take(1),
    map(() => configActions.loadConfig({ config: inject(APPCONFIG) }))
  ),
  { functional: true }
);

