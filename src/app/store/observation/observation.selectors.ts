import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { GroupInfo, State } from './observation.state';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { isForbiddenObservationError } from './utils/errors';
import { fromGroupContent } from 'src/app/groups/store';
import { ObservationInfo } from './observation.actions';
import { RootState } from 'src/app/utils/store/root_state';

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
  selectObservedGroupInfo: MemoizedSelector<T, ({ route: RawGroupRoute } & GroupInfo) | null | undefined>,
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
  /**
   * If starting observation on the active content is allowed (and not already enabled), the observation info.
   * Null if there is no group active content. False if it cannot be watched.
   */
  selectStartObservingActiveContentGroupInfo: MemoizedSelector<T, ObservationInfo | null | false>,
}

export function selectors<T extends RootState>(selectObservationState: Selector<T, State>): ObservationSelectors<T> {

  const selectGroup = createSelector(
    selectObservationState,
    state => state.group
  );

  const selectObservedGroupId = createSelector(
    selectGroup,
    g => g?.route.id ?? null
  );

  const selectObservedGroupRoute = createSelector(
    selectGroup,
    g => g?.route ?? null
  );

  const selectObservedGroupInfo = createSelector(
    selectGroup,
    g => (g ? (g.info.isReady ? { route: g.route, ...g.info.data } : undefined) : null)
  );

  const selectIsObserving = createSelector(
    selectGroup,
    g => g !== null
  );

  const selectObservationError = createSelector(
    selectGroup,
    g => (g?.info.isError ? { isForbidden: isForbiddenObservationError(g.info.error) } : false)
  );

  const selectActiveContentIsBeingObserved = createSelector(
    selectObservedGroupId,
    fromGroupContent.selectActiveContentRoute,
    (observedGroupId, activeGroupRoute) => observedGroupId === activeGroupRoute?.id
  );

  const selectStartObservingActiveContentGroupInfo = createSelector(
    selectActiveContentIsBeingObserved,
    fromGroupContent.selectObservationInfoForActiveContent,
    (activeContentIsBeingObserved, info) => (!activeContentIsBeingObserved ? info : null)
  );

  return {
    selectObservedGroupId,
    selectObservedGroupRoute,
    selectObservedGroupInfo,
    selectIsObserving,
    selectObservationError,
    selectActiveContentIsBeingObserved,
    selectStartObservingActiveContentGroupInfo,
  };
}
