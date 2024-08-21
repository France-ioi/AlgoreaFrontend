import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './time-offset.state';
import { interceptorActions } from './time-offset.actions';

export const reducer = createReducer(
  initialState,

  on(interceptorActions.reportOffset,
    ({ latestOffsets }, { offset }): State => ({
      latestOffsets: [ ...latestOffsets.slice(-4), offset ], // only keep the latest 5 values at most
    })
  ),

);
