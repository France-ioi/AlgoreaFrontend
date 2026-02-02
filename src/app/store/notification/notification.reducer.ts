import { createReducer, on } from '@ngrx/store';
import { readyState } from 'src/app/utils/state';
import { State, initialState } from './notification.state';
import { notificationApiActions, notificationWebsocketActions } from './notification.actions';

export const reducer = createReducer(
  initialState,

  on(
    notificationApiActions.fetchStateChanged,
    (state, { fetchState }): State => ({ ...state, notificationsState: fetchState })
  ),

  on(
    notificationWebsocketActions.notificationReceived,
    (state, { notification }): State => {
      const current = state.notificationsState;
      // Only merge if state is ready
      if (!current.isReady) return state;
      // Avoid duplicates by sk
      if (current.data.some(n => n.sk === notification.sk)) return state;
      return {
        ...state,
        notificationsState: readyState([ notification, ...current.data ]),
      };
    }
  ),

  on(
    notificationApiActions.notificationDeleted,
    (state, { sk }): State => {
      const current = state.notificationsState;
      if (!current.isReady) return state;
      return {
        ...state,
        notificationsState: readyState(current.data.filter(n => n.sk !== sk)),
      };
    }
  ),
);
