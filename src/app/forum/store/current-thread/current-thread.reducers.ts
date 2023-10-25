import { createReducer, on } from '@ngrx/store';
import { websocketClientActions } from '../websocket/websocket.actions';
import { areSameThreads } from '../../models/threads';
import { fetchingState, readyState } from 'src/app/utils/state';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { State, initialState } from './current-thread.store';
import { forumThreadListActions, itemPageActions, threadPanelActions, topBarActions } from './current-thread.actions';

const reducer = createReducer(
  initialState,

  on(websocketClientActions.eventsReceived, (state, { events }): State => ({
    ...state,
    events: readyState(
      [ ...state.events.data ?? [], ...events ]
        .sort((a, b) => a.time.valueOf() - b.time.valueOf()) // sort by date ascending
        .filter((el, i, list) => el.time.valueOf() !== list[i-1]?.time.valueOf()) // remove duplicate (using time as differentiator)
    )
  })),

  on(topBarActions.toggleCurrentThreadVisibility, (state): State => ({ ...state, visible: !state.visible })),

  on(forumThreadListActions.showAsCurrentThread, (state, { id }): State => {
    if (state.id && areSameThreads(state.id, id)) return state;
    else return {
      ...state,
      visible: true,
      id,
      info: fetchingState(),
      events: fetchingState(),
    };
  }),

  on(forumThreadListActions.hideCurrentThread, (state): State => ({ ...state, visible: false })),

  on(threadPanelActions.close, (state): State => ({ ...state, visible: false })),

  on(itemPageActions.currentThreadIdChange, (state, { id }): State => {
    if (state.id && areSameThreads(state.id, id)) return state;
    else return {
      ...state,
      id,
      info: fetchingState(),
      events: fetchingState(),
    };
  }),

  on(fetchThreadInfoActions.fetchStateChange, (state, { fetchState }): State => {
    if (!state.id) throw new Error('unexpected: no state id while changing thread info');
    if (fetchState.data && !areSameThreads(state.id, fetchState.data)) throw new Error('unexpected: fetch state thread <> state id');
    return { ...state, info: fetchState };
  }),

);

export default reducer;
