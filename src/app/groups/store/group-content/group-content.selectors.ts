import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import {
  GroupPage,
  GroupRoute,
  RawGroupRoute,
  isGroupRoute,
  isUser,
  managedGroupsPage,
  myGroupsPage,
  parseRouterPath
} from 'src/app/models/routing/group-route';
import { GroupRouteError, groupRouteFromParams, isGroupRouteError } from '../../utils/group-route-validation';
import { ObservationInfo } from 'src/app/store/observation';
import { fromRouter } from 'src/app/store/router';
import { GroupInState, State, UserInState } from './group-content.state';
import { fetchingState } from 'src/app/utils/state';
import { formatUser } from 'src/app/groups/models/user';
import { RootState } from 'src/app/utils/store/root_state';
import { selectIdParameter, selectPathParameter } from 'src/app/models/routing/content-route-selectors';
import { groupGroupTypeCategory, userGroupTypeCategory } from '../../models/group-types';

interface UserContentSelectors<T extends RootState> {
  selectIsGroupContentActive: MemoizedSelector<T, boolean>,
  selectIsUserContentActive: MemoizedSelector<T, boolean>,
  /**
   * The route error, if any, of the current active content if it is an item
   * To be used by the effect which handles the error
   */
  selectActiveContentRouteError: MemoizedSelector<T, GroupRouteError|null>,
  /**    /**
   * The state of route error handling (if there is an error)
   */
  selectActiveContentRouteErrorHandlingState: MemoizedSelector<T, State['routeErrorHandling']|null>,

  selectActiveContentRoute: MemoizedSelector<T, RawGroupRoute|null>,
  selectActiveContentFullRoute: MemoizedSelector<T, GroupRoute|null>,
  selectActiveContentRouteOrPage: MemoizedSelector<T, RawGroupRoute|GroupPage|null>,

  selectActiveContentUserId: MemoizedSelector<T, string|null>,
  selectActiveContentGroupId: MemoizedSelector<T, string|null>,
  selectActiveContentGroup: MemoizedSelector<T, GroupInState>,
  selectActiveContentUser: MemoizedSelector<T, UserInState>,
  /**
   * The breadcrumbs state, IF a full route is known for the active content
   * null if the breadcrumb is irrelevant, i.e. when there is no path
   */
  selectActiveContentBreadcrumbs: MemoizedSelector<T, State['breadcrumbs']|null>,

  /**
   * Group info required for observation
   * Null if there is no group as active content (or not fetched yet)
   * False if the group cannot be observed
   */
  selectObservationInfoForActiveContent: MemoizedSelector<T, ObservationInfo | false | null>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): UserContentSelectors<T> {

  const selectRouterPathParsingResult = createSelector(
    fromRouter.selectPath,
    path => (path ? parseRouterPath(path) : null)
  );

  const selectIsUserContentActive = createSelector(
    selectRouterPathParsingResult,
    pathParsingResult => pathParsingResult === userGroupTypeCategory
  );

  const selectIsNonUserGroupContentActive = createSelector(
    selectRouterPathParsingResult,
    pathParsingResult => pathParsingResult === groupGroupTypeCategory
  );

  const selectIsGroupContentActive = createSelector(
    selectIsUserContentActive,
    selectIsNonUserGroupContentActive,
    (isUser, isNonUserGroup) => isUser || isNonUserGroup
  );

  const selectActiveContentRouteParsingResult = createSelector(
    selectIsGroupContentActive,
    selectIsUserContentActive,
    selectIdParameter,
    selectPathParameter,
    (isGroupContent, isUser, id, path) => (isGroupContent ? groupRouteFromParams(id, path, isUser) : null)
  );

  const selectActiveContentRouteError = createSelector(
    selectActiveContentRouteParsingResult,
    result => (result && isGroupRouteError(result) ? result : null)
  );

  const selectActiveContentRouteErrorHandlingState = createSelector(
    selectState,
    selectActiveContentRouteError,
    (state, error) => (error !== null ? state.routeErrorHandling : null)
  );

  const selectActiveContentRoute = createSelector(
    selectActiveContentRouteParsingResult,
    result => (result && !isGroupRouteError(result) ? result : null)
  );

  /** select the full route only, so only if the path is defined */
  const selectActiveContentFullRoute = createSelector(
    selectActiveContentRoute,
    route => (route && isGroupRoute(route) ? route : null),
  );

  const selectActiveContentRouteOrPage = createSelector(
    selectActiveContentRoute,
    selectRouterPathParsingResult,
    (route, parsingResult) => {
      if (route) return route;
      if (parsingResult === myGroupsPage || parsingResult === managedGroupsPage) return parsingResult;
      return null;
    }
  );

  const selectActiveContentId = createSelector(
    selectActiveContentRoute,
    route => route?.id ?? null
  );

  const selectActiveContentUserId = createSelector(
    selectIsUserContentActive,
    selectActiveContentId,
    (isUser, id) => (isUser ? id : null)
  );

  const selectActiveContentGroupId = createSelector(
    selectIsUserContentActive,
    selectActiveContentId,
    (isUser, id) => (!isUser ? id : null)
  );

  const selectActiveContentGroup = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ group }, route) => (route && group.identifier?.id === route.id && !isUser(route) ? group as GroupInState : fetchingState())
  );

  const selectActiveContentUser = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ group }, route) => (route && group.identifier?.id === route.id && isUser(route) ? group as UserInState : fetchingState())
  );

  const selectActiveContentBreadcrumbs = createSelector(
    selectState,
    selectActiveContentFullRoute,
    ({ breadcrumbs }, route) => (breadcrumbs.identifier === route ? breadcrumbs : null)
  );

  const selectObservationInfoForActiveContentUser = createSelector(
    selectActiveContentUser,
    selectActiveContentRoute,
    ({ isReady, data }, route) => (
      route && isReady ? (
        data.currentUserCanWatchUser ?
          { route, name: formatUser(data), currentUserCanGrantAccess: !!data.currentUserCanGrantUserAccess } : false
      ) : null)
  );

  const selectObservationInfoForActiveContentGroup = createSelector(
    selectActiveContentGroup,
    selectActiveContentRoute,
    ({ isReady, data }, route) => (
      (route && isReady) ? (
        data.currentUserCanWatchMembers ?
          { route, name: data.name, currentUserCanGrantAccess: !!data.currentUserCanGrantGroupAccess } : false
      ) : null)
  );

  const selectObservationInfoForActiveContent = createSelector(
    selectObservationInfoForActiveContentUser,
    selectObservationInfoForActiveContentGroup,
    (obsInfoForUser, obsInfoForNonUserGroup) => (obsInfoForUser === null ? obsInfoForNonUserGroup : obsInfoForUser)
  );

  return {
    selectIsGroupContentActive,
    selectIsUserContentActive,
    selectActiveContentRouteError,
    selectActiveContentRouteErrorHandlingState,
    selectActiveContentRoute,
    selectActiveContentFullRoute,
    selectActiveContentRouteOrPage,
    selectActiveContentUserId,
    selectActiveContentGroupId,
    selectActiveContentGroup,
    selectActiveContentUser,
    selectActiveContentBreadcrumbs,

    selectObservationInfoForActiveContent,
  };
}
