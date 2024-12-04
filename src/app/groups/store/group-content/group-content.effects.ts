import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { fromGroupContent } from './group-content.store';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { formatBreadcrumbs } from '../../models/group-breadcrumbs';

const selectNonUserCurrentContent = createSelector(
  fromGroupContent.selectIsUserContentActive,
  fromGroupContent.selectActiveContentFullRoute,
  fromGroupContent.selectActiveContentBreadcrumbs,
  fromGroupContent.selectActiveContentGroup,
  (isUser, route, breadcrumbsState, groupState) =>
    (route && !isUser ? { route, breadcrumbs: breadcrumbsState?.data, group: groupState.data } : null)
);

export const dispatchNonUserCurrentContentEffect = createEffect(
  (
    store$ = inject(Store),
    groupRouter = inject(GroupRouter),
  ) => store$.select(selectNonUserCurrentContent).pipe(
    filter(isNotNull),
    map(({ route, breadcrumbs, group }) => fromCurrentContent.contentPageActions.changeContent({
      route,
      breadcrumbs: breadcrumbs ? formatBreadcrumbs(breadcrumbs, groupRouter) : undefined,
      title: group?.name,
    }))
  ),
  { functional: true },
);
