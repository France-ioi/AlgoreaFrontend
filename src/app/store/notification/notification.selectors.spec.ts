import { selectors } from './notification.selectors';
import { State } from './notification.state';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { Notification } from 'src/app/data-access/notification.service';

const mockNotifications: Notification[] = [
  { sk: 123, notificationType: 'test', payload: {}, readTime: undefined },
  { sk: 124, notificationType: 'test2', payload: {}, readTime: 1000 },
];

// Create typed selectors for testing
const testSelectors = selectors<{ notification: State }>(state => state.notification);

describe('notification selectors', () => {
  describe('selectNotificationsState', () => {
    it('should return the notifications state', () => {
      const state: { notification: State } = {
        notification: { notificationsState: readyState(mockNotifications) }
      };
      expect(testSelectors.selectNotificationsState(state)).toEqual(readyState(mockNotifications));
    });
  });

  describe('selectUnreadCount', () => {
    it('should return 0 when fetching', () => {
      const state: { notification: State } = {
        notification: { notificationsState: fetchingState() }
      };
      expect(testSelectors.selectUnreadCount(state)).toEqual(0);
    });

    it('should return 0 when error', () => {
      const state: { notification: State } = {
        notification: { notificationsState: errorState(new Error('test')) }
      };
      expect(testSelectors.selectUnreadCount(state)).toEqual(0);
    });

    it('should count unread notifications when ready', () => {
      const state: { notification: State } = {
        notification: { notificationsState: readyState(mockNotifications) }
      };
      // Only 1 notification has readTime undefined
      expect(testSelectors.selectUnreadCount(state)).toEqual(1);
    });

    it('should return 0 when all notifications are read', () => {
      const allRead: Notification[] = [
        { sk: 123, notificationType: 'test', payload: {}, readTime: 1000 },
      ];
      const state: { notification: State } = {
        notification: { notificationsState: readyState(allRead) }
      };
      expect(testSelectors.selectUnreadCount(state)).toEqual(0);
    });
  });
});
