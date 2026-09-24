import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { ForumNewMessageNotification, GroupResultsExportReadyNotification } from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
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

describe('showNotificationToastEffect', () => {
  it('toasts forum and export notifications and attaches forum onClick', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
      const store = jasmine.createSpyObj('Store', [ 'dispatch' ]);
      const actions$ = hot('-a-b-|', {
        a: notificationWebsocketActions.notificationReceived({ notification: forumNotification }),
        b: notificationWebsocketActions.notificationReceived({ notification: readyNotification }),
      });

      showNotificationToastEffect(
        actions$,
        messageService,
        getItemByIdService,
        store as never,
      ).subscribe();
      flush();

      expect(messageService.add).toHaveBeenCalledTimes(2);
      const forumToast = messageService.add.calls.argsFor(0)[0];
      expect(forumToast.summary).toBe('New message');
      expect(forumToast.onClick).toEqual(jasmine.any(Function));

      const exportToast = messageService.add.calls.argsFor(1)[0];
      expect(exportToast.summary).toBe('Export ready');
      expect(exportToast.onClick).toBeUndefined();
    });
  });

  it('does not toast unknown notification types', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const actions$ = hot('-a-|', {
        a: notificationWebsocketActions.notificationReceived({
          notification: { sk: 9, notificationType: 'something.unknown', payload: {} },
        }),
      });

      showNotificationToastEffect(
        actions$,
        messageService,
        {} as GetItemByIdService,
        {} as never,
      ).subscribe();
      flush();

      expect(messageService.add).not.toHaveBeenCalled();
    });
  });

  it('opens the forum thread when the toast is clicked', () => {
    testScheduler.run(({ hot, flush }) => {
      const messageService = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
      const getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
      getItemByIdService.get.and.returnValue(of({ string: { title: 'Activity' } } as Item));
      const store = jasmine.createSpyObj('Store', [ 'dispatch' ]);
      const actions$ = hot('-a-|', {
        a: notificationWebsocketActions.notificationReceived({ notification: forumNotification }),
      });

      showNotificationToastEffect(
        actions$,
        messageService,
        getItemByIdService,
        store as never,
      ).subscribe();
      flush();

      messageService.add.calls.argsFor(0)[0].onClick?.();
      expect(getItemByIdService.get).toHaveBeenCalledWith('i1');
      expect(store.dispatch).toHaveBeenCalled();
    });
  });
});
