import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { fromItemContent } from './item-content.store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { formatBreadcrumbs } from '../../models/item-breadcrumbs';

const selectCurrentContent = createSelector(
  fromItemContent.selectActiveContentRoute,
  fromItemContent.selectActiveContentBreadcrumbs,
  fromItemContent.selectActiveContentItem,
  (route, breadcrumbsState, itemState) => (route ? { route, breadcrumbs: breadcrumbsState.data, item: itemState.data } : null)
);

export const dispatchCurrentContentEffect = createEffect(
  (
    store$ = inject(Store),
    itemRouter = inject(ItemRouter),
  ) => store$.select(selectCurrentContent).pipe(
    filter(isNotNull),
    map(({ route, breadcrumbs, item }) => fromCurrentContent.contentPageActions.changeContent({
      route: route,
      breadcrumbs: breadcrumbs ? formatBreadcrumbs(breadcrumbs, itemRouter) : undefined,
      title: item?.string.title ?? undefined,
    }))
  ),
  { functional: true },
);
