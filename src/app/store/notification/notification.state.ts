import { FetchState, fetchingState } from 'src/app/utils/state';
import { Notification } from 'src/app/models/notification';

export interface State {
  notificationsState: FetchState<Notification[]>,
}

export const initialState: State = {
  notificationsState: fetchingState(),
};
