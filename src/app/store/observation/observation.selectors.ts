import { MemoizedSelector, createSelector } from '@ngrx/store';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { isForbiddenObservationError } from './utils/errors';
import { fromGroupContent } from 'src/app/groups/store';
import { RootState } from 'src/app/utils/store/root_state';
import { fromItemContent } from 'src/app/items/store';
import { ObservationInfo } from './models';

interface ObservationSelectors<T extends RootState> {
  /**
   * The observed-group id, null is observation not enabled
   */
  selectObservedGroupId: MemoizedSelector<T, string|null>,
    /**
   * The observed-group route, null is observation not enabled
   */
  selectObservedGroupRoute: MemoizedSelector<T, RawGroupRoute|null>,
  /**
   * The observed-group information (route and fetched info). `null` if is observation not enabled. `undefined` if info not known (yet).
   */
  selectObservedGroupInfo: MemoizedSelector<T, ObservationInfo|null>,
  /**
   * Whether observation is enabled
   */
  selectIsObserving: MemoizedSelector<T, boolean>,
  /**
   * Whether the observed group caused an error a fetching error (because of network error, group not visible, group cannot be observed)
   * Possible values:
   *  - `{ isForbidden: boolean }` if there is an error. `isForbidden` is true if the group cannot be observed (or do not exist)
   *  - `undefined` if it is still unknown,
   *  - `null` if there is no error.
   */
  selectObservationError: MemoizedSelector<T, { isForbidden: boolean } | undefined | null>,
  /**
   * Whether the active content is being observed
   */
  selectActiveContentIsBeingObserved: MemoizedSelector<T, boolean>,
}

export function selectors<T extends RootState>(): ObservationSelectors<T> {

  /**
   * The observation info fetching state for the active group content IF
   *   - the current content is a group/user and
   *   - the fetched group info is for the active group/user,
   *   - the fetched group can be observed,
   * `null` otherwise
   * Note that we do check for observation permission before returning the state as there are absolutely no guarantee when navigating
   * that the group can be observed.
   */
  const selectObservationInfoFetchingStateForActiveGroupContent = createSelector(
    fromGroupContent.selectActiveContentRoute,
    fromGroupContent.selectObservationInfoForFetchedContent,
    (route, obsInfo) => (route && route.id === obsInfo?.identifier?.id && obsInfo?.data?.currentUserWatchGroup ? obsInfo : null)
  );

  /**
   * The observation info fetching state for the active item content IF
   *   - the current content is an item, and
   *   - observation is enabled on the route, and
   *   - the fetched group info is for the active item
   * `null` otherwise
   * Note that we do not check whether the fetched group can be observed, because we expect that to be checked before navigation.
   * Observation error on items will be reported by `selectObservationError`.
   */
  const selectObservationInfoFetchingStateForActiveItemContent = createSelector(
    fromItemContent.selectActiveContentObservedGroup,
    fromGroupContent.selectObservationInfoForFetchedContent,
    (obsGroupFromRoute, obsInfo) => (obsGroupFromRoute && obsGroupFromRoute.id === obsInfo?.identifier?.id ? obsInfo : null)
  );

  const selectObservationInfoFetchingStateForActiveContent = createSelector(
    selectObservationInfoFetchingStateForActiveGroupContent,
    selectObservationInfoFetchingStateForActiveItemContent,
    (obsInfoFromGroup, obsInfoFromItem) => obsInfoFromGroup ?? obsInfoFromItem
  );

  const selectObservationError = createSelector(
    selectObservationInfoFetchingStateForActiveContent,
    info => {
      if (!info) return null; // no observation requested
      if (info.isFetching) return undefined; // we don't know yet
      if (info.isError) return { isForbidden: isForbiddenObservationError(info.error) };
      if (info.isReady && !info.data?.currentUserWatchGroup) return { isForbidden: true };
      return null; // the group can be observed
    }
  );

  const selectObservedGroupRoute = createSelector(
    selectObservationInfoFetchingStateForActiveContent,
    fetchingState => (fetchingState && fetchingState.identifier ? fetchingState.identifier : null),
  );

  const selectObservedGroupId = createSelector(
    selectObservedGroupRoute,
    route => (route ? route.id : null),
  );

  const selectIsObserving = createSelector(
    selectObservedGroupRoute,
    route => route !== null
  );

  const selectObservationInfoDataForActiveContent = createSelector(
    selectObservationInfoFetchingStateForActiveContent,
    state => (state ? state.data : null),
  );

  const selectObservedGroupInfo = createSelector(
    selectObservationInfoDataForActiveContent,
    data => (data && data.currentUserWatchGroup ? data : null)
  );

  const selectActiveContentIsBeingObserved = createSelector(
    selectObservedGroupId,
    fromGroupContent.selectActiveContentRoute,
    (observedGroupId, activeGroupRoute) => observedGroupId === activeGroupRoute?.id
  );

  return {
    selectObservedGroupId,
    selectObservedGroupRoute,
    selectObservedGroupInfo,
    selectIsObserving,
    selectObservationError,
    selectActiveContentIsBeingObserved
  };
}
