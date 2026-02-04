import { reducer } from './notification.reducer';
import { initialState } from './notification.state';
import { notificationApiActions } from './notification.actions';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { Notification } from 'src/app/models/notification';

const mockNotifications: Notification[] = [
  { sk: 123, notificationType: 'test', payload: {}, readTime: undefined }
];

describe('notification reducer', () => {
  it('should return the initial state', () => {
    const result = reducer(undefined, { type: 'unknown' });
    expect(result).toEqual(initialState);
  });

  it('should handle fetchStateChanged with fetching state', () => {
    const fetchState = fetchingState<Notification[]>();
    const action = notificationApiActions.fetchStateChanged({ fetchState });
    const result = reducer(initialState, action);
    expect(result.notificationsState.isFetching).toBeTrue();
  });

  it('should handle fetchStateChanged with ready state', () => {
    const fetchState = readyState(mockNotifications);
    const action = notificationApiActions.fetchStateChanged({ fetchState });
    const result = reducer(initialState, action);
    expect(result.notificationsState.isReady).toBeTrue();
    expect(result.notificationsState.data).toEqual(mockNotifications);
  });

  it('should handle fetchStateChanged with error state', () => {
    const error = new Error('Test error');
    const fetchState = errorState(error);
    const action = notificationApiActions.fetchStateChanged({ fetchState });
    const result = reducer(initialState, action);
    expect(result.notificationsState.isError).toBeTrue();
    expect(result.notificationsState.error).toEqual(error);
  });
});
