import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { pathFromParamValue, pathParamName } from 'src/app/models/routing/content-route';
import { GroupRoute, RawGroupRoute, contentTypeOfPath, groupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { ObservationInfo } from 'src/app/store/observation';
import { fromRouter } from 'src/app/store/router';
import { State } from './user-content.state';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { User } from '../../models/user';
import { formatUser } from 'src/app/groups/models/user';
import { RootState } from 'src/app/utils/store/root_state';

interface UserContentSelectors<T extends RootState> {
  selectIsUserContentActive: MemoizedSelector<T, boolean>,
  selectActiveContentUserId: MemoizedSelector<T, string|null>,
  selectActiveContentUserRoute: MemoizedSelector<T, RawGroupRoute|null>,
  selectActiveContentUserFullRoute: MemoizedSelector<T, GroupRoute|null>,
  selectActiveContentUser: MemoizedSelector<T, FetchState<User>>,
  selectActiveContentBreadcrumbs: MemoizedSelector<T, FetchState<GroupBreadcrumbs>|null>,

  /**
   * Null if there is no user as active content, or if the user cannot be observed, or if user info is not fetched
   */
  selectObservationInfoForActiveContentUser: MemoizedSelector<T, ObservationInfo | null>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): UserContentSelectors<T> {

  const selectIsUserContentActive = createSelector(
    fromRouter.selectPath,
    path => !!path && contentTypeOfPath(path) === 'user'
  );

  const selectActiveContentUserId = createSelector(
    selectIsUserContentActive,
    fromRouter.selectParam('id'),
    (isActive, id) => (isActive && id ? id : null)
  );

  const selectActiveContentUserPath = createSelector(
    selectIsUserContentActive,
    fromRouter.selectParam(pathParamName),
    (isActive, path) => (isActive && path ? pathFromParamValue(path) : null)
  );

  const selectActiveContentUserRoute = createSelector(
    selectActiveContentUserId,
    selectActiveContentUserPath,
    (id, path) => (id ? (path ? groupRoute({ id, isUser: true }, path) : rawGroupRoute({ id, isUser: true })) : null)
  );

  /** select the full route only, so only if the path is defined */
  const selectActiveContentUserFullRoute = createSelector(
    selectActiveContentUserId,
    selectActiveContentUserPath,
    (id, path) => (id && path ? groupRoute({ id, isUser: true }, path) : null)
  );

  const selectActiveContentUser = createSelector(
    selectState,
    selectIsUserContentActive,
    (state, active) => (active ? state.user : fetchingState())
  );

  const selectActiveContentBreadcrumbs = createSelector(
    selectState,
    selectActiveContentUserPath,
    (state, path) => (path !== null ? state.breadcrumbs : null)
  );

  const selectCanWatchActiveContentUser = createSelector(
    selectActiveContentUser,
    ({ isReady, data }) => isReady && !!data.currentUserCanWatchUser && !data.isCurrentUser
  );

  const selectObservationInfoForActiveContentUser = createSelector(
    selectCanWatchActiveContentUser,
    selectActiveContentUserRoute,
    selectActiveContentUser,
    (canWatchUser, route, { isReady, data }) => (canWatchUser && route && isReady ? {
      route,
      name: formatUser(data),
      currentUserCanGrantAccess: data.currentUserCanGrantUserAccess ?? false
    } : null)
  );

  return {
    selectIsUserContentActive,
    selectActiveContentUserId,
    selectActiveContentUserRoute,
    selectActiveContentUserFullRoute,
    selectActiveContentUser,
    selectActiveContentBreadcrumbs,

    selectObservationInfoForActiveContentUser,
  };
}
