import { EMPTY, toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { clearNotificationsOnThreadShownEffect } from './notification-thread-cleanup.effects';
import { notificationApiActions } from './notification.actions';
import { ForumNewMessageNotification, Notification } from 'src/app/models/notification';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { readyState, fetchingState } from 'src/app/utils/state';
import { fromForum } from 'src/app/forum/store';
import { itemRoute } from 'src/app/models/routing/item-route';
import { AppConfig } from 'src/app/config';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const createForumNotification = (
  participantId: string,
  itemId: string,
  sk: number
): ForumNewMessageNotification => ({
  sk,
  notificationType: 'forum.new_message',
  payload: { participantId, itemId, time: 1000, text: 'Hello', authorId: '3', uuid: 'abc' },
  readTime: undefined,
});

const createGenericNotification = (sk: number): Notification => ({
  sk,
  notificationType: 'other.type',
  payload: {},
  readTime: undefined,
});

const enabledConfig = { featureFlags: { enableNotifications: true } } as AppConfig;
const disabledConfig = { featureFlags: { enableNotifications: false } } as AppConfig;

describe('clearNotificationsOnThreadShownEffect', () => {
  let notificationServiceSpy: jasmine.SpyObj<NotificationHttpService>;

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj<NotificationHttpService>(
      'NotificationHttpService',
      ['deleteNotification']
    );
  });

  it('does nothing when enableNotifications is false', done => {
    clearNotificationsOnThreadShownEffect(EMPTY, {} as never, notificationServiceSpy, disabledConfig)
      .pipe(toArray())
      .subscribe({
        next: actions => {
          expect(actions.length).toEqual(0);
          expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
          done();
        },
      });
  });

  it('deletes matching notifications when thread is shown', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification1 = createForumNotification('p1', 'i1', 100);
      const notification2 = createForumNotification('p1', 'i1', 101);
      const notification3 = createForumNotification('p2', 'i2', 102); // Different thread

      notificationServiceSpy.deleteNotification.and.callFake(() => cold('-a|', { a: undefined }));

      const actions$ = hot('-a---|', {
        a: fromForum.notificationActions.showThread({
          id: { participantId: 'p1', itemId: 'i1' },
          item: { route: itemRoute('activity', 'i1'), title: 'Test' },
        }),
      });
      const notificationsState$ = cold('a----|', {
        a: readyState([ notification1, notification2, notification3 ]),
      });
      const store$ = { select: () => notificationsState$ } as never;

      clearNotificationsOnThreadShownEffect(actions$, store$, notificationServiceSpy, enabledConfig)
        .pipe(toArray())
        .subscribe({
          next: actions => {
            expect(actions.length).toEqual(2);
            expect(actions).toContain(notificationApiActions.notificationDeleted({ sk: 100 }));
            expect(actions).toContain(notificationApiActions.notificationDeleted({ sk: 101 }));
            expect(notificationServiceSpy.deleteNotification).toHaveBeenCalledWith(100);
            expect(notificationServiceSpy.deleteNotification).toHaveBeenCalledWith(101);
            expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalledWith(102);
            done();
          },
        });
    });
  });

  it('does nothing when notifications state is not ready', done => {
    testScheduler.run(({ hot, cold }) => {
      const actions$ = hot('-a|', {
        a: fromForum.notificationActions.showThread({
          id: { participantId: 'p1', itemId: 'i1' },
          item: { route: itemRoute('activity', 'i1'), title: 'Test' },
        }),
      });
      const notificationsState$ = cold('a|', { a: fetchingState() });
      const store$ = { select: () => notificationsState$ } as never;

      clearNotificationsOnThreadShownEffect(actions$, store$, notificationServiceSpy, enabledConfig)
        .pipe(toArray())
        .subscribe({
          next: actions => {
            expect(actions.length).toEqual(0);
            expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
            done();
          },
        });
    });
  });

  it('does nothing when no notifications match the thread', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification1 = createForumNotification('p2', 'i2', 100); // Different thread
      const notification2 = createGenericNotification(101); // Not a forum notification

      const actions$ = hot('-a|', {
        a: fromForum.notificationActions.showThread({
          id: { participantId: 'p1', itemId: 'i1' },
          item: { route: itemRoute('activity', 'i1'), title: 'Test' },
        }),
      });
      const notificationsState$ = cold('a|', {
        a: readyState([ notification1, notification2 ]),
      });
      const store$ = { select: () => notificationsState$ } as never;

      clearNotificationsOnThreadShownEffect(actions$, store$, notificationServiceSpy, enabledConfig)
        .pipe(toArray())
        .subscribe({
          next: actions => {
            expect(actions.length).toEqual(0);
            expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
            done();
          },
        });
    });
  });

  it('handles forumThreadListActions.showAsCurrentThread', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('p1', 'i1', 100);
      notificationServiceSpy.deleteNotification.and.callFake(() => cold('-a|', { a: undefined }));

      const actions$ = hot('-a---|', {
        a: fromForum.forumThreadListActions.showAsCurrentThread({
          id: { participantId: 'p1', itemId: 'i1' },
          item: { route: itemRoute('activity', 'i1'), title: 'Test' },
        }),
      });
      const notificationsState$ = cold('a----|', {
        a: readyState([ notification ]),
      });
      const store$ = { select: () => notificationsState$ } as never;

      clearNotificationsOnThreadShownEffect(actions$, store$, notificationServiceSpy, enabledConfig)
        .pipe(toArray())
        .subscribe({
          next: actions => {
            expect(actions.length).toEqual(1);
            expect(actions[0]).toEqual(notificationApiActions.notificationDeleted({ sk: 100 }));
            done();
          },
        });
    });
  });

  it('still dispatches notificationDeleted when delete API fails', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('p1', 'i1', 100);
      notificationServiceSpy.deleteNotification.and.returnValue(
        cold('#', undefined, new Error('API error'))
      );

      const actions$ = hot('-a---|', {
        a: fromForum.notificationActions.showThread({
          id: { participantId: 'p1', itemId: 'i1' },
          item: { route: itemRoute('activity', 'i1'), title: 'Test' },
        }),
      });
      const notificationsState$ = cold('a----|', {
        a: readyState([ notification ]),
      });
      const store$ = { select: () => notificationsState$ } as never;

      clearNotificationsOnThreadShownEffect(actions$, store$, notificationServiceSpy, enabledConfig)
        .pipe(toArray())
        .subscribe({
          next: actions => {
            expect(actions.length).toEqual(1);
            expect(actions[0]).toEqual(notificationApiActions.notificationDeleted({ sk: 100 }));
            done();
          },
        });
    });
  });
});
