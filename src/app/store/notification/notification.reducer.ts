import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './notification.state';
import { notificationApiActions } from './notification.actions';

export const reducer = createReducer(
  initialState,

  on(
    notificationApiActions.fetchStateChanged,
    (state, { fetchState }): State => ({ ...state, notificationsState: fetchState })
  ),
);
