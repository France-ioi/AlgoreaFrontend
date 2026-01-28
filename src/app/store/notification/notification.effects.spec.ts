import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { fetchNotificationsEffect } from './notification.effects';
import { Notification, NotificationHttpService } from 'src/app/data-access/notification.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const mockProfile = { groupId: '1' } as unknown as CurrentUserProfile;
const mockNotifications: Notification[] = [
  { sk: 123, notificationType: 'test', payload: {}, readTime: undefined }
];

describe('fetchNotificationsEffect', () => {
  it('fetches notifications when user profile is available', done => {
    const notificationServiceSpy = jasmine.createSpyObj<NotificationHttpService>('NotificationHttpService', [ 'getNotifications' ]);
    testScheduler.run(({ hot, cold }) => {
      notificationServiceSpy.getNotifications.and.callFake(() => cold('-a|', { a: mockNotifications }));
      const userProfile$ = hot('p----|', { p: mockProfile });
      const userSessionServiceMock = { userProfile$ } as unknown as UserSessionService;
      const actions$ = hot('    -----|');

      fetchNotificationsEffect(
        actions$,
        userSessionServiceMock,
        notificationServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions.length).toEqual(2);
          expect(actions[0]?.fetchState.isFetching).toBeTrue();
          expect(actions[1]?.fetchState.isReady).toBeTrue();
          expect(actions[1]?.fetchState.data).toEqual(mockNotifications);
          expect(notificationServiceSpy.getNotifications).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('waits for user profile before fetching', done => {
    const notificationServiceSpy = jasmine.createSpyObj<NotificationHttpService>('NotificationHttpService', [ 'getNotifications' ]);
    testScheduler.run(({ hot, cold }) => {
      notificationServiceSpy.getNotifications.and.callFake(() => cold('-a|', { a: mockNotifications }));
      // Profile emits after a delay
      const userProfile$ = hot('--p--|', { p: mockProfile });
      const userSessionServiceMock = { userProfile$ } as unknown as UserSessionService;
      const actions$ = hot('    -----|');

      fetchNotificationsEffect(
        actions$,
        userSessionServiceMock,
        notificationServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions.length).toEqual(2);
          expect(notificationServiceSpy.getNotifications).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });
});
