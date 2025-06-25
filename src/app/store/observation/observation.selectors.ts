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
   * `false` is not an error, otherwise `{ isForbidden: boolean }` indicating whether that looks like a permission issue.
   */
  selectObservationError: MemoizedSelector<T, { isForbidden: boolean } | false>,
  /**
   * Whether the active content is being observed
   */
  selectActiveContentIsBeingObserved: MemoizedSelector<T, boolean>,
}

export function selectors<T extends RootState>(): ObservationSelectors<T> {

  const selectObservationInfoForActiveGroupContent = createSelector(
    fromGroupContent.selectActiveContentRoute,
    fromGroupContent.selectObservationInfoForFetchedContent,
    (route, obsInfo) => (route && route.id === obsInfo?.identifier?.id ? obsInfo : null)
  );

  const selectObservationInfoForActiveItemContent = createSelector(
    fromItemContent.selectActiveContentObservedGroup,
    fromGroupContent.selectObservationInfoForFetchedContent,
    (obsGroupFromRoute, obsInfo) => (obsGroupFromRoute && obsGroupFromRoute.id === obsInfo?.identifier?.id ? obsInfo : null)
  );

  const selectObservationInfoForActiveContent = createSelector(
    selectObservationInfoForActiveGroupContent,
    selectObservationInfoForActiveItemContent,
    (obsInfoFromGroup, obsInfoFromItem) => obsInfoFromGroup ?? obsInfoFromItem
  );

  const selectObservationGroupInfoForActiveContent = createSelector(
    selectObservationInfoForActiveContent,
    info => (info ? info.data : null),
  );

  const selectObservedGroupInfo = createSelector(
    selectObservationGroupInfoForActiveContent,
    info => (info && info.currentUserWatchGroup ? info : null)
  );

  const selectObservedGroupRoute = createSelector(
    selectObservedGroupInfo,
    info => (info ? info.route : null),
  );

  const selectObservedGroupId = createSelector(
    selectObservedGroupRoute,
    route => (route ? route.id : null),
  );

  const selectIsObserving = createSelector(
    selectObservedGroupInfo,
    info => info !== null
  );

  const selectObservationError = createSelector(
    selectObservationInfoForActiveContent,
    info => (info && info.isError ? { isForbidden: isForbiddenObservationError(info.error) } : false)
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
