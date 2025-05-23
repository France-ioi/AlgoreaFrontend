import { inject } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { map, take } from 'rxjs/operators';
import { DEFAULT_ACTIVITY_ROUTE, DEFAULT_SKILL_ROUTE } from 'src/app/models/routing/default-route-tokens';
import { appInitActions } from './app-init.actions';

// Effect to trigger initialization once on app startup
export const triggerAppInitEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(ROOT_EFFECTS_INIT),
    take(1), // Ensure this runs only once
    map(() => appInitActions.init())
  ),
  { functional: true }
);

// Effect to load default routes (from config) at app init
export const loadDefaultRoutesEffect$ = createEffect(
  (
    actions$ = inject(Actions)
  ) => actions$.pipe(
    ofType(appInitActions.init),
    map(() => {
      const defaultActivityRoute = inject(DEFAULT_ACTIVITY_ROUTE);
      const defaultSkillRoute = inject(DEFAULT_SKILL_ROUTE);
      return appInitActions.setDefaultRoutes({ defaultActivityRoute, defaultSkillRoute });
    })
  ),
  { functional: true }
);
