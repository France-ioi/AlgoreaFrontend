import { EMPTY, toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { fetchNotificationsEffect } from './notification.effects';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { Notification } from 'src/app/models/notification';
import { UserSessionService } from 'src/app/services/user-session.service';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';
import { AppConfig } from 'src/app/config';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const mockProfile = { groupId: '1' } as unknown as CurrentUserProfile;
const mockNotifications: Notification[] = [
  { sk: 123, notificationType: 'test', payload: {}, readTime: undefined }
];
const enabledConfig = { featureFlags: { enableNotifications: true } } as AppConfig;
const disabledConfig = { featureFlags: { enableNotifications: false } } as AppConfig;

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
        enabledConfig,
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

  it('does nothing when enableNotifications is false', done => {
    const notificationServiceSpy = jasmine.createSpyObj<NotificationHttpService>('NotificationHttpService', [ 'getNotifications' ]);
    fetchNotificationsEffect(
      EMPTY,
      {} as UserSessionService,
      notificationServiceSpy,
      disabledConfig,
    ).pipe(toArray()).subscribe({
      next: actions => {
        expect(actions.length).toEqual(0);
        expect(notificationServiceSpy.getNotifications).not.toHaveBeenCalled();
        done();
      }
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
        enabledConfig,
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
