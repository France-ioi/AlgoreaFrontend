import { TestScheduler } from 'rxjs/testing';
import { notificationWebsocketEffect } from './notification-websocket.effects';
import { websocketClientActions } from 'src/app/store/websocket';
import { notificationApiActions, notificationWebsocketActions } from './notification.actions';
import { ForumNewMessageNotification } from 'src/app/models/notification';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { of } from 'rxjs';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const createForumNotification = (
  participantId: string,
  itemId: string,
  sk = 123
): ForumNewMessageNotification => ({
  sk,
  notificationType: 'forum.new_message',
  payload: { participantId, itemId, time: 1000, text: 'Hello', authorId: '3', uuid: 'abc' },
  readTime: undefined,
});

describe('notificationWebsocketEffect', () => {
  let notificationServiceSpy: jasmine.SpyObj<NotificationHttpService>;

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj<NotificationHttpService>(
      'NotificationHttpService',
      ['deleteNotification']
    );
    notificationServiceSpy.deleteNotification.and.returnValue(of(undefined));
  });

  it('dispatches notificationReceived when thread is not visible', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('participant1', 'item1');
      const wsMessage = { action: 'notification.new', notification };

      const actions$ = hot('-a|', {
        a: websocketClientActions.messageReceived({ message: wsMessage }),
      });
      const threadStatus$ = cold('a|', { a: undefined }); // No active thread
      const store$ = { select: () => threadStatus$ } as never;

      notificationWebsocketEffect(actions$, store$, notificationServiceSpy).subscribe({
        next: action => {
          expect(action).toEqual(notificationWebsocketActions.notificationReceived({ notification }));
          expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('dispatches notificationReceived when thread is visible but different from notification', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('participant1', 'item1');
      const wsMessage = { action: 'notification.new', notification };

      const actions$ = hot('-a|', {
        a: websocketClientActions.messageReceived({ message: wsMessage }),
      });
      // Thread visible but different participantId/itemId
      const threadStatus$ = cold('a|', {
        a: { id: { participantId: 'other', itemId: 'other' }, visible: true, open: true },
      });
      const store$ = { select: () => threadStatus$ } as never;

      notificationWebsocketEffect(actions$, store$, notificationServiceSpy).subscribe({
        next: action => {
          expect(action).toEqual(notificationWebsocketActions.notificationReceived({ notification }));
          expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('dispatches notificationReceived when thread matches but is not visible', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('participant1', 'item1');
      const wsMessage = { action: 'notification.new', notification };

      const actions$ = hot('-a|', {
        a: websocketClientActions.messageReceived({ message: wsMessage }),
      });
      // Thread matches but not visible
      const threadStatus$ = cold('a|', {
        a: { id: { participantId: 'participant1', itemId: 'item1' }, visible: false, open: true },
      });
      const store$ = { select: () => threadStatus$ } as never;

      notificationWebsocketEffect(actions$, store$, notificationServiceSpy).subscribe({
        next: action => {
          expect(action).toEqual(notificationWebsocketActions.notificationReceived({ notification }));
          expect(notificationServiceSpy.deleteNotification).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('deletes notification when thread is visible and matches notification', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('participant1', 'item1', 456);
      const wsMessage = { action: 'notification.new', notification };

      const actions$ = hot('-a|', {
        a: websocketClientActions.messageReceived({ message: wsMessage }),
      });
      // Thread matches and is visible
      const threadStatus$ = cold('a|', {
        a: { id: { participantId: 'participant1', itemId: 'item1' }, visible: true, open: true },
      });
      const store$ = { select: () => threadStatus$ } as never;

      notificationWebsocketEffect(actions$, store$, notificationServiceSpy).subscribe({
        next: action => {
          expect(action).toEqual(notificationApiActions.notificationDeleted({ sk: 456 }));
          expect(notificationServiceSpy.deleteNotification).toHaveBeenCalledWith(456);
          done();
        },
      });
    });
  });

  it('still dispatches notificationDeleted when delete API fails', done => {
    testScheduler.run(({ hot, cold }) => {
      const notification = createForumNotification('participant1', 'item1', 789);
      const wsMessage = { action: 'notification.new', notification };

      notificationServiceSpy.deleteNotification.and.returnValue(
        cold('#', undefined, new Error('API error'))
      );

      const actions$ = hot('-a|', {
        a: websocketClientActions.messageReceived({ message: wsMessage }),
      });
      const threadStatus$ = cold('a|', {
        a: { id: { participantId: 'participant1', itemId: 'item1' }, visible: true, open: true },
      });
      const store$ = { select: () => threadStatus$ } as never;

      notificationWebsocketEffect(actions$, store$, notificationServiceSpy).subscribe({
        next: action => {
          expect(action).toEqual(notificationApiActions.notificationDeleted({ sk: 789 }));
          done();
        },
      });
    });
  });
});
