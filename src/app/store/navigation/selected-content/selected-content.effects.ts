import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { fromItemContent } from 'src/app/items/store';
import { changedContentActions } from './selected-content.actions';
import { fromGroupContent } from 'src/app/groups/store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const keepActiveItemContentEffect = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(fromItemContent.selectActiveContentRoute).pipe(
    filter(isNotNull),
    map(route => changedContentActions.changeItemRoute({ route })),
  ),
  { functional: true },
);

export const keepActiveGroupContentEffect = createEffect(
  (
    store$ = inject(Store),
  ) => store$.select(fromGroupContent.selectActiveContentRouteOrPage).pipe(
    filter(isNotNull),
    map(routeOrPage => changedContentActions.changeGroupRouteOrPage({ routeOrPage })),
  ),
  { functional: true },
);
