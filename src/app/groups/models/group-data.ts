import { GroupRoute } from 'src/app/models/routing/group-route';
import { Group } from './group';
import { GroupBreadcrumbs } from './group-breadcrumbs';
import { fromGroupContent } from '../store';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { createSelector } from '@ngrx/store';

/**
 * All fetched data related to one group
 * (for backward (pre-store) compatibily)
 */
export interface GroupData {
  route: GroupRoute,
  group: Group,
  breadcrumbs: GroupBreadcrumbs,
}

export const selectGroupData = createSelector(
  fromGroupContent.selectActiveContentRouteErrorHandlingState,
  fromGroupContent.selectActiveContentGroupState,
  fromGroupContent.selectActiveContentFullRoute,
  fromGroupContent.selectActiveContentBreadcrumbsState,
  (errorHandling, group, route, breadcrumbs) => {
    if (errorHandling?.isFetching) return fetchingState();
    if (errorHandling?.isError) return errorState(errorHandling.error);
    if (group.isError) return errorState(group.error);
    if (!route || !breadcrumbs) return fetchingState();
    if (breadcrumbs.isError) return errorState(breadcrumbs.error);
    if (group.isFetching || breadcrumbs.isFetching) return fetchingState();
    return readyState({ group: group.data, route, breadcrumbs: breadcrumbs.data });
  }
);
