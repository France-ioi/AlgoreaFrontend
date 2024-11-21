import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { fromItemContent } from 'src/app/items/store';
import { changedContentActions } from './selected-content.actions';
import { fromGroupContent } from 'src/app/groups/store';

const selectActiveContentRoute = createSelector(
  fromItemContent.selectActiveContentRoute,
  fromGroupContent.selectActiveContentFullRoute,
  fromGroupContent.selectIsUserContentActive,
  (itemRoute, groupRoute, isUser) => itemRoute ?? (isUser ? groupRoute : null)
);

export const keepActiveContentEffect = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(selectActiveContentRoute).pipe(
    map(route => changedContentActions.changeContent({ route })),
  ),
  { functional: true },
);
