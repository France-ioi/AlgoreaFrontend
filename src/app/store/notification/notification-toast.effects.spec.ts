import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import {
  ForumNewMessageNotification,
  GroupResultsExportFailedNotification,
  GroupResultsExportReadyNotification,
} from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { NotificationInteractionService } from 'src/app/services/notification-interaction.service';
import { notificationWebsocketActions } from './notification.actions';
import { showNotificationToastEffect } from './notification-toast.effects';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const forumNotification: ForumNewMessageNotification = {
  sk: 1,
  notificationType: 'forum.new_message',
  payload: {
    participantId: 'p1',
    itemId: 'i1',
    time: 1000,
    text: 'Hello',
    authorId: 'a1',
    uuid: 'u1',
  },
};

const readyNotification: GroupResultsExportReadyNotification = {
  sk: 2,
  notificationType: 'group_results_export.ready',
  payload: {
    exportId: 'exp-1',
    groupId: 'g1',
    groupName: 'Class A',
    items: [ { id: 'i1', title: 'Chapter 1' } ],
    filename: 'export.zip',
    sizeBytes: 1024,
    expiresAt: 1893456000000,
  },
};

const failedNotification: GroupResultsExportFailedNotification = {
  sk: 3,
  notificationType: 'group_results_export.failed',
  payload: {
    exportId: 'exp-2',
    groupId: 'g1',
    groupName: 'Class A',
    items: [ { id: 'i1', title: 'Chapter 1' } ],
    error: 'Timeout',
  },
};

describe('showNotificationToastEffect', () => {
  it('toasts forum and export notifications with onClick for each', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const notificationInteraction = jasmine.createSpyObj<NotificationInteractionService>(
        'NotificationInteractionService',
        [ 'activate$' ],
      );
      notificationInteraction.activate$.and.returnValue(of(undefined));
      const actions$ = hot('-a-b-c-|', {
        a: notificationWebsocketActions.notificationReceived({ notification: forumNotification }),
        b: notificationWebsocketActions.notificationReceived({ notification: readyNotification }),
        c: notificationWebsocketActions.notificationReceived({ notification: failedNotification }),
      });

      showNotificationToastEffect(actions$, messageService, notificationInteraction).subscribe();
      flush();

      expect(messageService.add).toHaveBeenCalledTimes(3);
      expect(messageService.add.calls.argsFor(0)[0].onClick).toEqual(jasmine.any(Function));
      expect(messageService.add.calls.argsFor(1)[0].onClick).toEqual(jasmine.any(Function));
      expect(messageService.add.calls.argsFor(2)[0].onClick).toEqual(jasmine.any(Function));
    });
  });

  it('does not toast unknown notification types', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const notificationInteraction = jasmine.createSpyObj<NotificationInteractionService>(
        'NotificationInteractionService',
        [ 'activate$' ],
      );
      const actions$ = hot('-a-|', {
        a: notificationWebsocketActions.notificationReceived({
          notification: { sk: 9, notificationType: 'something.unknown', payload: {} },
        }),
      });

      showNotificationToastEffect(actions$, messageService, notificationInteraction).subscribe();
      flush();

      expect(messageService.add).not.toHaveBeenCalled();
    });
  });

  it('activates the notification when the toast is clicked', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const notificationInteraction = jasmine.createSpyObj<NotificationInteractionService>(
        'NotificationInteractionService',
        [ 'activate$' ],
      );
      notificationInteraction.activate$.and.returnValue(of(undefined));
      const actions$ = hot('-a-b-c-|', {
        a: notificationWebsocketActions.notificationReceived({ notification: forumNotification }),
        b: notificationWebsocketActions.notificationReceived({ notification: readyNotification }),
        c: notificationWebsocketActions.notificationReceived({ notification: failedNotification }),
      });

      showNotificationToastEffect(actions$, messageService, notificationInteraction).subscribe();
      flush();

      messageService.add.calls.argsFor(0)[0].onClick?.();
      expect(notificationInteraction.activate$).toHaveBeenCalledWith(forumNotification);

      messageService.add.calls.argsFor(1)[0].onClick?.();
      expect(notificationInteraction.activate$).toHaveBeenCalledWith(readyNotification);

      messageService.add.calls.argsFor(2)[0].onClick?.();
      expect(notificationInteraction.activate$).toHaveBeenCalledWith(failedNotification);
    });
  });
});
