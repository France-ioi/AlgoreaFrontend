import { createFeature, createReducer, on } from '@ngrx/store';
import { websocketClientActions } from './websocket.actions';

export interface State {
  open: boolean,
}

export const initialState: State = {
  open: false,
};

export const reducer = createReducer(
  initialState,
  on(websocketClientActions.statusChanged, (state, { open }): State => ({ ...state, open })),
);

export const fromWebsocket = createFeature({
  name: 'websocket',
  reducer,
});
