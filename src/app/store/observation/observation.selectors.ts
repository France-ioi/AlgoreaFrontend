import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { GroupInfo, State } from './observation.state';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { isForbiddenObservationError } from './utils/errors';

interface ObservationSelectors<T> {
  selectObservedGroupId: MemoizedSelector<T, string|null>,
  selectObservedGroupRoute: MemoizedSelector<T, RawGroupRoute|null>,
  selectObservedGroupInfo: MemoizedSelector<T, ({ route: RawGroupRoute } & GroupInfo) | null | undefined>,
  selectIsObserving: MemoizedSelector<T, boolean>,
  selectObservationError: MemoizedSelector<T, { isForbidden: boolean } | false>,
}

// eslint-disable-next-line @ngrx/prefix-selectors-with-select
export const selectors = <T>(selectGroup: Selector<T, State['group']>): ObservationSelectors<T> => ({

  /**
   * The observed-group id, null is observation not enabled
   */
  selectObservedGroupId: createSelector(
    selectGroup,
    g => g?.route.id ?? null
  ),

  /**
   * The observed-group route, null is observation not enabled
   */
  selectObservedGroupRoute: createSelector(
    selectGroup,
    g => g?.route ?? null
  ),

  /**
   * The observed-group information (route and fetched info). `null` if is observation not enabled. `undefined` if info not known (yet).
   */
  selectObservedGroupInfo: createSelector(
    selectGroup,
    g => (g ? (g.info.isReady ? { route: g.route, ...g.info.data } : undefined) : null)
  ),

  /**
   * Whether observation is enabled
   */
  selectIsObserving: createSelector(
    selectGroup,
    g => g !== null
  ),

  /**
   * Whether the observed group caused an error a fetching error (because of network error, group not visible, group cannot be observed)
   * `false` is not an error, otherwise `{ isForbidden: boolean }` indicating whether that looks like a permission issue.
   */
  selectObservationError: createSelector(
    selectGroup,
    g => (g?.info.isError ? { isForbidden: isForbiddenObservationError(g.info.error) } : false)
  ),

});
