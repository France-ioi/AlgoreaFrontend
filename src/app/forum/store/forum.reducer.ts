import { combineReducers, createReducer, on } from '@ngrx/store';
import currentThreadReducers from './current-thread/current-thread.reducer';
import { initialState } from './forum.state';
import { configActions } from './forum.actions';

export const reducer = combineReducers({
  currentThread: currentThreadReducers,
  enabled: createReducer(initialState.enabled,
    on(configActions.forumEnabled, (_state, { enabled }): boolean => enabled),
  ),
}, initialState);
