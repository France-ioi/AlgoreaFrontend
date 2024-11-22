import { GroupRoute } from 'src/app/models/routing/group-route';
import { Group } from '../data-access/get-group-by-id.service';
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
  fromGroupContent.selectActiveContentGroup,
  fromGroupContent.selectActiveContentFullRoute,
  fromGroupContent.selectActiveContentBreadcrumbs,
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
