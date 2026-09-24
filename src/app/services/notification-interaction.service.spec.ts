import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, Subject, throwError } from 'rxjs';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { GroupResultsExportService } from 'src/app/data-access/group-results-export.service';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { fromForum } from 'src/app/forum/store';
import {
  ForumNewMessageNotification,
  GroupResultsExportFailedNotification,
  GroupResultsExportReadyNotification,
} from 'src/app/models/notification';
import { itemRoute } from 'src/app/models/routing/item-route';
import { notificationApiActions } from 'src/app/store/notification';
import { MessageService } from './message.service';
import { NotificationInteractionService } from './notification-interaction.service';

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

const expiredReadyNotification: GroupResultsExportReadyNotification = {
  ...readyNotification,
  sk: 3,
  payload: {
    ...readyNotification.payload,
    exportId: 'exp-expired',
    expiresAt: 1577836800000,
  },
};

const invalidExpiryNotification: GroupResultsExportReadyNotification = {
  ...readyNotification,
  sk: 5,
  payload: {
    ...readyNotification.payload,
    exportId: 'exp-invalid',
    expiresAt: Number.NaN,
  },
};

const failedNotification: GroupResultsExportFailedNotification = {
  sk: 4,
  notificationType: 'group_results_export.failed',
  payload: {
    exportId: 'exp-2',
    groupId: 'g1',
    groupName: 'Class A',
    items: [ { id: 'i1', title: 'Chapter 1' } ],
    error: 'Timeout',
  },
};

describe('NotificationInteractionService', () => {
  let service: NotificationInteractionService;
  let store: MockStore;
  let notificationHttp: jasmine.SpyObj<NotificationHttpService>;
  let groupResultsExport: jasmine.SpyObj<GroupResultsExportService>;
  let getItemById: jasmine.SpyObj<GetItemByIdService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    notificationHttp = jasmine.createSpyObj('NotificationHttpService', [ 'deleteNotification' ]);
    notificationHttp.deleteNotification.and.returnValue(of(undefined));
    groupResultsExport = jasmine.createSpyObj('GroupResultsExportService', [ 'getDownloadUrl' ]);
    getItemById = jasmine.createSpyObj('GetItemByIdService', [ 'get' ]);
    getItemById.get.and.returnValue(of({ string: { title: 'Activity' } } as Item));
    messageService = jasmine.createSpyObj('MessageService', [ 'add' ]);

    TestBed.configureTestingModule({
      providers: [
        NotificationInteractionService,
        provideMockStore(),
        { provide: NotificationHttpService, useValue: notificationHttp },
        { provide: GroupResultsExportService, useValue: groupResultsExport },
        { provide: GetItemByIdService, useValue: getItemById },
        { provide: MessageService, useValue: messageService },
      ],
    });

    service = TestBed.inject(NotificationInteractionService);
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('clear$ deletes and always dispatches notificationDeleted', () => {
    service.clear$(10).subscribe();

    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(10);
    expect(store.dispatch).toHaveBeenCalledWith(
      notificationApiActions.notificationDeleted({ sk: 10 }),
    );
  });

  it('clear$ still dispatches notificationDeleted when the API fails', () => {
    notificationHttp.deleteNotification.and.returnValue(throwError(() => new Error('fail')));

    service.clear$(11).subscribe();

    expect(store.dispatch).toHaveBeenCalledWith(
      notificationApiActions.notificationDeleted({ sk: 11 }),
    );
  });

  it('activate$ opens the forum thread without deleting', () => {
    service.activate$(forumNotification).subscribe();

    expect(getItemById.get).toHaveBeenCalledWith('i1');
    expect(store.dispatch).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: 'p1', itemId: 'i1' },
        item: { route: itemRoute('activity', 'i1'), title: 'Activity' },
      }),
    );
    expect(notificationHttp.deleteNotification).not.toHaveBeenCalled();
  });

  it('activate$ opens forum with forbidden title when item fetch is forbidden', () => {
    getItemById.get.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.activate$(forumNotification).subscribe();

    expect(store.dispatch).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: 'p1', itemId: 'i1' },
        item: { route: itemRoute('activity', 'i1'), title: 'Not visible content' },
      }),
    );
  });

  it('activate$ opens forum with error title when item fetch fails', () => {
    getItemById.get.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    service.activate$(forumNotification).subscribe();

    expect(store.dispatch).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: 'p1', itemId: 'i1' },
        item: { route: itemRoute('activity', 'i1'), title: 'Error fetching content title' },
      }),
    );
  });

  it('activate$ on ready downloads and deletes in parallel', () => {
    groupResultsExport.getDownloadUrl.and.returnValue(of('https://cdn.example/file.zip'));
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

    service.activate$(readyNotification).subscribe();

    expect(groupResultsExport.getDownloadUrl).toHaveBeenCalledWith('exp-1');
    expect(clickSpy).toHaveBeenCalled();
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(2);
    expect(store.dispatch).toHaveBeenCalledWith(
      notificationApiActions.notificationDeleted({ sk: 2 }),
    );
  });

  it('activate$ on failed only deletes', () => {
    service.activate$(failedNotification).subscribe();

    expect(groupResultsExport.getDownloadUrl).not.toHaveBeenCalled();
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(4);
  });

  it('activate$ on expired ready only deletes', () => {
    service.activate$(expiredReadyNotification).subscribe();

    expect(groupResultsExport.getDownloadUrl).not.toHaveBeenCalled();
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(3);
  });

  it('treats NaN expiresAt as expired and only deletes', () => {
    expect(service.isExportLinkExpired(invalidExpiryNotification)).toBeTrue();

    service.activate$(invalidExpiryNotification).subscribe();

    expect(groupResultsExport.getDownloadUrl).not.toHaveBeenCalled();
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(5);
  });

  it('does not delete a second ready export while a download is in flight', () => {
    const download$ = new Subject<string>();
    groupResultsExport.getDownloadUrl.and.returnValue(download$.asObservable());

    service.activate$(readyNotification).subscribe();
    service.activate$({
      ...readyNotification,
      sk: 99,
      payload: { ...readyNotification.payload, exportId: 'exp-other' },
    }).subscribe();

    expect(groupResultsExport.getDownloadUrl).toHaveBeenCalledTimes(1);
    expect(notificationHttp.deleteNotification).toHaveBeenCalledTimes(1);
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(2);
    expect(notificationHttp.deleteNotification).not.toHaveBeenCalledWith(99);

    download$.next('https://cdn.example/file.zip');
    download$.complete();
  });

  it('marks export expired on download-url 404 and still deletes', () => {
    groupResultsExport.getDownloadUrl.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    service.activate$(readyNotification).subscribe();

    expect(service.isExportLinkExpired(readyNotification)).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: jasmine.stringMatching(/expired/i),
    }));
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(2);
  });

  it('toasts on non-404 download failure and still deletes', () => {
    groupResultsExport.getDownloadUrl.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    service.activate$(readyNotification).subscribe();

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: jasmine.stringMatching(/failed to download/i),
    }));
    expect(notificationHttp.deleteNotification).toHaveBeenCalledWith(2);
  });
});
