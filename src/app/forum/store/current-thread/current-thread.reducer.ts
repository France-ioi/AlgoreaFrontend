import { createReducer, on } from '@ngrx/store';
import { areSameThreads } from '../../models/threads';
import { fetchingState } from 'src/app/utils/state';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { State, initialState } from './current-thread.store';
import { forumThreadListActions, itemPageActions, notificationActions, threadPanelActions, topBarActions } from './current-thread.actions';
import { eventFetchingActions } from './event-fetching.actions';
import { websocketIncomingMessageActions } from './websocket-incoming-message.actions';
import { mergeSubmissionEvent } from '../../models/thread-events-conversions';
import { followStatusActions } from './follow-status.actions';

const reducer = createReducer(
  initialState,

  on(websocketIncomingMessageActions.forumMessageReceived, (state, { threadId, message }): State => ({
    ...state,
    wsEvents: state.id && areSameThreads(state.id, threadId) ? [ ...state.wsEvents, message ] : state.wsEvents,
  })),

  on(websocketIncomingMessageActions.forumSubmissionReceived, (state, { threadId, submission }): State => ({
    ...state,
    wsEvents: state.id && areSameThreads(state.id, threadId)
      ? mergeSubmissionEvent(state.wsEvents, submission)
      : state.wsEvents,
  })),

  on(eventFetchingActions.logEventsFetchStateChanged, (state, { fetchState }): State => {
    // Preserve previous data when refetching for the same thread
    if (fetchState.isFetching && fetchState.identifier && state.id && areSameThreads(fetchState.identifier, state.id)) {
      return { ...state, logEvents: fetchingState(state.logEvents.data, fetchState.identifier) };
    }
    return { ...state, logEvents: fetchState };
  }),

  on(eventFetchingActions.slsEventsFetchStateChanged, (state, { fetchState }): State => {
    // Preserve previous data when refetching for the same thread
    if (fetchState.isFetching && fetchState.identifier && state.id && areSameThreads(fetchState.identifier, state.id)) {
      return { ...state, slsEvents: fetchingState(state.slsEvents.data, fetchState.identifier) };
    }
    return { ...state, slsEvents: fetchState };
  }),

  on(topBarActions.toggleCurrentThreadVisibility, (state): State => ({ ...state, visible: !state.visible })),

  on(
    forumThreadListActions.showAsCurrentThread,
    notificationActions.showThread,
    (state): State => ({ ...state, visible: true })
  ),

  on(
    forumThreadListActions.hideCurrentThread,
    threadPanelActions.close,
    (state): State => ({ ...state, visible: false })
  ),

  on(threadPanelActions.close, (state): State => ({ ...state, visible: false })),

  on(
    itemPageActions.changeCurrentThreadId,
    forumThreadListActions.showAsCurrentThread,
    notificationActions.showThread,
    (state, { id, item }): State => ({
      ...state,
      id,
      item,
      info: state.id && areSameThreads(state.id, id) ? state.info : fetchingState(),
      slsEvents: state.id && areSameThreads(state.id, id) ? state.slsEvents : fetchingState(),
      logEvents: state.id && areSameThreads(state.id, id) ? state.logEvents : fetchingState(),
      wsEvents: state.id && areSameThreads(state.id, id) ? state.wsEvents : [],
      followStatus: state.id && areSameThreads(state.id, id) ? state.followStatus : fetchingState(),
    })
  ),

  on(fetchThreadInfoActions.fetchStateChanged, (state, { fetchState }): State => ({ ...state, info: fetchState })),

  on(followStatusActions.fetchStateChanged, (state, { fetchState }): State => ({ ...state, followStatus: fetchState })),

);

export default reducer;
