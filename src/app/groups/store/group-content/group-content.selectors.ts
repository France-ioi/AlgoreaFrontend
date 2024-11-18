import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { pathFromParamValue, pathParamName } from 'src/app/models/routing/content-route';
import { GroupRoute, RawGroupRoute, contentTypeOfPath, groupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { ObservationInfo } from 'src/app/store/observation';
import { fromRouter } from 'src/app/store/router';
import { State } from './group-content.state';
import { FetchState, fetchingState } from 'src/app/utils/state';
import { User } from '../../models/user';
import { formatUser } from 'src/app/groups/models/user';
import { RootState } from 'src/app/utils/store/root_state';
import { Group } from '../../data-access/get-group-by-id.service';

interface UserContentSelectors<T extends RootState> {
  selectIsGroupContentActive: MemoizedSelector<T, boolean>,
  selectActiveContentGroupId: MemoizedSelector<T, string|null>,
  selectActiveContentUserId: MemoizedSelector<T, string|null>,
  selectActiveContentNonUserGroupId: MemoizedSelector<T, string|null>,
  selectActiveContentGroupRoute: MemoizedSelector<T, RawGroupRoute|null>,
  selectActiveContentGroupFullRoute: MemoizedSelector<T, GroupRoute|null>,
  selectActiveContentNonUserGroup: MemoizedSelector<T, FetchState<Group, RawGroupRoute>>,
  selectActiveContentUser: MemoizedSelector<T, FetchState<User, RawGroupRoute>>,
  selectActiveContentBreadcrumbs: MemoizedSelector<T, State['breadcrumbs']|null>,

  /**
   * Null if there is no group as active content, or if the group cannot be observed, or if group info is not fetched
   */
  selectObservationInfoForActiveContentGroup: MemoizedSelector<T, ObservationInfo | null>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): UserContentSelectors<T> {

  const selectIsGroupContentActive = createSelector(
    fromRouter.selectPath,
    path => !!path && !!contentTypeOfPath(path)
  );

  const selectIsUserContentActive = createSelector(
    fromRouter.selectPath,
    path => !!path && contentTypeOfPath(path) === 'user'
  );

  const selectIsNonUserGroupContentActive = createSelector(
    fromRouter.selectPath,
    path => !!path && contentTypeOfPath(path) === 'group'
  );

  const selectActiveContentGroupId = createSelector(
    selectIsGroupContentActive,
    fromRouter.selectParam('id'),
    (isActive, id) => (isActive && id ? id : null)
  );

  const selectActiveContentUserId = createSelector(
    selectIsUserContentActive,
    selectActiveContentGroupId,
    (isUser, id) => (isUser ? id : null)
  );

  const selectActiveContentNonUserGroupId = createSelector(
    selectIsNonUserGroupContentActive,
    selectActiveContentGroupId,
    (isNonUserGroup, id) => (isNonUserGroup ? id : null)
  );

  const selectActiveContentGroupPath = createSelector(
    selectIsGroupContentActive,
    fromRouter.selectParam(pathParamName),
    (isActive, path) => (isActive && path ? pathFromParamValue(path) : null)
  );

  const selectActiveContentGroupRoute = createSelector(
    selectActiveContentGroupId,
    selectActiveContentGroupPath,
    selectIsUserContentActive,
    (id, path, isUser) => (id ? (path ? groupRoute({ id, isUser }, path) : rawGroupRoute({ id, isUser })) : null)
  );

  /** select the full route only, so only if the path is defined */
  const selectActiveContentGroupFullRoute = createSelector(
    selectActiveContentGroupId,
    selectActiveContentGroupPath,
    selectIsUserContentActive,
    (id, path, isUser) => (id && path ? groupRoute({ id, isUser }, path) : null)
  );

  const selectActiveContentGroup = createSelector(
    selectState,
    selectIsGroupContentActive,
    (state, active) => (active ? state.group : fetchingState())
  );

  const selectActiveContentNonUserGroup = createSelector(
    selectActiveContentGroup,
    group => (group.identifier?.contentType === 'group' ? group as FetchState<Group, RawGroupRoute> : fetchingState())
  );

  const selectActiveContentUser = createSelector(
    selectActiveContentGroup,
    group => (group.identifier?.contentType === 'user' ? group as FetchState<User, RawGroupRoute> : fetchingState())
  );

  const selectActiveContentBreadcrumbs = createSelector(
    selectState,
    selectActiveContentGroupPath,
    (state, path) => (path !== null ? state.breadcrumbs : null)
  );

  const selectObservationInfoForActiveContentUser = createSelector(
    selectActiveContentUser,
    selectActiveContentGroupRoute,
    ({ isReady, data }, route) => (route && isReady && !!data.currentUserCanWatchUser ? {
      route,
      name: formatUser(data),
      currentUserCanGrantAccess: data.currentUserCanGrantUserAccess ?? false
    } : null)
  );

  const selectObservationInfoForActiveContentNonUserGroup = createSelector(
    selectActiveContentNonUserGroup,
    selectActiveContentGroupRoute,
    ({ isReady, data }, route) => (route && isReady && !!data.currentUserCanWatchMembers ? {
      route,
      name: data.name,
      currentUserCanGrantAccess: data.currentUserCanGrantGroupAccess ?? false
    } : null)
  );

  const selectObservationInfoForActiveContentGroup = createSelector(
    selectObservationInfoForActiveContentUser,
    selectObservationInfoForActiveContentNonUserGroup,
    (obsInfoForUser, obsInfoForNonUserGroup) => obsInfoForUser ?? obsInfoForNonUserGroup
  );

  return {
    selectIsGroupContentActive,
    selectActiveContentGroupId,
    selectActiveContentUserId,
    selectActiveContentNonUserGroupId,
    selectActiveContentGroupRoute,
    selectActiveContentGroupFullRoute,
    selectActiveContentNonUserGroup,
    selectActiveContentUser,
    selectActiveContentBreadcrumbs,

    selectObservationInfoForActiveContentGroup,
  };
}
