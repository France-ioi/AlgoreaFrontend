import { inject } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { configActions } from './forum.actions';
import { APPCONFIG } from 'src/app/config';

export const forumConfigEffect = createEffect(
  (
    config = inject(APPCONFIG),
  ) => of(configActions.forumEnabled({ enabled: config.featureFlags.enableForum })),
  { functional: true, dispatch: true }
);
