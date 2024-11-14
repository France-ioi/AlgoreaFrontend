import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { fromItemContent } from 'src/app/items/store';
import { changedContentActions } from './selected-content.actions';

const selectActiveContentRoute = createSelector(
  fromItemContent.selectActiveContentRoute,
  itemRoute => itemRoute
);

export const keepActiveContentEffect = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(selectActiveContentRoute).pipe(
    map(route => changedContentActions.changeContent({ route })),
  ),
  { functional: true },
);
