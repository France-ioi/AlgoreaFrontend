import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './time-offset.state';
import { RootState } from 'src/app/utils/store/root_state';
import { median } from 'src/app/utils/array';

interface TimeOffsetSelectors<T extends RootState> {
  /**
   * The current time offset computed as the median of the 5 latest measured values.
   * A positive value means the client is late on the server time. So you have to add the offset to the client time to get the server one.
   */
  selectCurrentTimeOffset: MemoizedSelector<T, number>,
}

export function selectors<T extends RootState>(selectTimeOffsetState: Selector<T, State>): TimeOffsetSelectors<T> {
  return {
    selectCurrentTimeOffset: createSelector(
      selectTimeOffsetState,
      ({ latestOffsets }) => (latestOffsets.length === 0 ? 0 : median(latestOffsets))
    )
  };
}
