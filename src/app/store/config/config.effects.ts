import { inject } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { map, take } from 'rxjs/operators';
import { DEFAULT_ACTIVITY_ROUTE, DEFAULT_SKILL_ROUTE } from 'src/app/config/default-route-tokens';
import { configActions } from './config.actions';
import { APPCONFIG } from 'src/app/config';

// Effect to trigger initialization once on app startup
export const triggerConfigInitEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(ROOT_EFFECTS_INIT),
    take(1), // Ensure this runs only once
    map(() => configActions.init())
  ),
  { functional: true }
);

export const loadConfigEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(configActions.init),
    map(() => {
      const config = inject(APPCONFIG);
      return configActions.loadConfig({ config });
    })
  ),
  { functional: true }
);

// Effect to load default routes (from config) at app init
export const loadDefaultRoutesEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(configActions.init),
    map(() => {
      const defaultActivityRoute = inject(DEFAULT_ACTIVITY_ROUTE);
      const defaultSkillRoute = inject(DEFAULT_SKILL_ROUTE);
      return configActions.setDefaultRoutes({ defaultActivityRoute, defaultSkillRoute });
    })
  ),
  { functional: true }
);
