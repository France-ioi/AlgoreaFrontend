import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import {
  GroupPage,
  GroupRoute,
  RawGroupRoute,
  isGroupRoute,
  isUser,
  managedGroupsPage,
  myGroupsPage,
  parseRouterPath,
  rawGroupRoute
} from 'src/app/models/routing/group-route';
import { GroupRouteError, groupRouteFromParams, isGroupRouteError } from '../../utils/group-route-validation';
import { ObservationInfo } from 'src/app/store/observation';
import { fromRouter } from 'src/app/store/router';
import { GroupInState, State, UserInState } from './group-content.state';
import { fetchingState, FetchState, mapStateData } from 'src/app/utils/state';
import { formatUser } from 'src/app/groups/models/user';
import { RootState } from 'src/app/utils/store/root_state';
import { selectIdParameter } from 'src/app/models/routing/content-route-selectors';
import { groupGroupTypeCategory, userGroupTypeCategory } from '../../models/group-types';
import { selectPathParameter } from 'src/app/models/routing/path-parameter';

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

  selectActiveContentGroupState: MemoizedSelector<T, GroupInState>,
  selectActiveContentUserState: MemoizedSelector<T, UserInState>,
  /**
   * The breadcrumbs state, IF a full route is known for the active content
   * null if the breadcrumb is irrelevant, i.e. when there is no path
   */
  selectActiveContentBreadcrumbsState: MemoizedSelector<T, State['breadcrumbsState']|null>,

  /**
   * Group info required for observation for the fetched group
   * Null if there is no group has been fetched yet
   */
  selectObservationInfoForFetchedContent: MemoizedSelector<T, FetchState<ObservationInfo|undefined, RawGroupRoute> | null>,
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

  const selectActiveContentGroupState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ groupState }, route) => (route && groupState.identifier?.id === route.id && !isUser(route) ?
      groupState as GroupInState : fetchingState())
  );

  const selectActiveContentUserState = createSelector(
    selectState,
    selectActiveContentRoute,
    ({ groupState }, route) => (route && groupState.identifier?.id === route.id && isUser(route) ?
      groupState as UserInState : fetchingState())
  );

  const selectActiveContentBreadcrumbsState = createSelector(
    selectState,
    selectActiveContentFullRoute,
    ({ breadcrumbsState }, route) => (breadcrumbsState.identifier === route ? breadcrumbsState : null)
  );

  const selectObservationInfoForFetchedUser = createSelector(
    selectState,
    ({ groupState }) => (groupState.identifier && isUser(groupState.identifier) ?
      mapStateData(groupState as UserInState, data => (data ? {
        route: rawGroupRoute({ id: data.groupId, isUser: true }),
        name: formatUser(data),
        currentUserCanGrantAccess: !!data.currentUserCanGrantUserAccess,
        currentUserWatchGroup: !!data.currentUserCanWatchUser && !data.isCurrentUser
      } : undefined)) :
      null /* not a user */
    )
  );

  const selectObservationInfoForFetchedNonUserGroup = createSelector(
    selectState,
    ({ groupState }) => (groupState.identifier && !isUser(groupState.identifier) ?
      mapStateData(groupState as GroupInState, data => (data ? {
        route: rawGroupRoute({ id: data.id, isUser: false }),
        name: data.name,
        currentUserCanGrantAccess: !!data.currentUserCanGrantGroupAccess,
        currentUserWatchGroup: !!data.currentUserCanWatchMembers
      } : undefined)) :
      null /* not a group */
    )
  );

  const selectObservationInfoForFetchedContent = createSelector(
    selectObservationInfoForFetchedUser,
    selectObservationInfoForFetchedNonUserGroup,
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
    selectActiveContentGroupState,
    selectActiveContentUserState,
    selectActiveContentBreadcrumbsState,

    selectObservationInfoForFetchedContent,
  };
}
