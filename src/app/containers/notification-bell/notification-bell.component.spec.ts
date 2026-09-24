import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, Subject, throwError } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { fromNotification } from '../../store/notification';
import { fromForum } from '../../forum/store';
import { fetchingState, readyState, errorState } from 'src/app/utils/state';
import {
  ForumNewMessageNotification,
  GroupResultsExportFailedNotification,
  GroupResultsExportReadyNotification,
  Notification,
} from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { GroupResultsExportService } from 'src/app/data-access/group-results-export.service';

const mockForumNotifications: ForumNewMessageNotification[] = [
  {
    sk: 123,
    notificationType: 'forum.new_message',
    payload: { participantId: '1', itemId: '2', time: 1000, text: 'Hello', authorId: '3', uuid: 'abc' },
    readTime: undefined,
  },
  {
    sk: 124,
    notificationType: 'forum.new_message',
    payload: { participantId: '1', itemId: '2', time: 2000, text: 'World', authorId: '3', uuid: 'def' },
    readTime: undefined,
  },
];

const readyExportNotification: GroupResultsExportReadyNotification = {
  sk: 200,
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

const expiredExportNotification: GroupResultsExportReadyNotification = {
  ...readyExportNotification,
  sk: 201,
  payload: {
    ...readyExportNotification.payload,
    exportId: 'exp-expired',
    expiresAt: 1577836800000,
  },
};

const invalidExpiryNotification: GroupResultsExportReadyNotification = {
  ...readyExportNotification,
  sk: 203,
  payload: {
    ...readyExportNotification.payload,
    exportId: 'exp-invalid',
    expiresAt: Number.NaN,
  },
};

const failedExportNotification: GroupResultsExportFailedNotification = {
  sk: 202,
  notificationType: 'group_results_export.failed',
  payload: {
    exportId: 'exp-2',
    groupId: 'g1',
    groupName: 'Class A',
    items: [ { id: 'i1', title: 'Chapter 1' } ],
    error: 'Timeout',
  },
};

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let store: MockStore<object>;
  let getItemByIdService: jasmine.SpyObj<GetItemByIdService>;
  let groupResultsExportService: jasmine.SpyObj<GroupResultsExportService>;
  let messageService: { add: jasmine.Spy };

  beforeEach(async () => {
    getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
    getItemByIdService.get.and.returnValue(of({ string: { title: 'Test Item' } } as Item));
    groupResultsExportService = jasmine.createSpyObj('GroupResultsExportService', [ 'getDownloadUrl' ]);
    messageService = { add: jasmine.createSpy('add') };

    await TestBed.configureTestingModule({
      imports: [ NotificationBellComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromNotification.selectNotificationsState, value: fetchingState() }
          ]
        }),
        { provide: MessageService, useValue: messageService },
        { provide: GetItemByIdService, useValue: getItemByIdService },
        { provide: NotificationHttpService, useValue: { deleteAllNotifications: () => of(undefined) } },
        { provide: GroupResultsExportService, useValue: groupResultsExportService },
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show ? when fetching', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, fetchingState());
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('?');
  });

  it('should show ! when error', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, errorState(new Error('test')));
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('!');
    expect(component.notificationsState().isError).toBeTrue();
  });

  it('should show count when has unread notifications', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(mockForumNotifications));
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('2');
  });

  it('should show 0 when no unread notifications', () => {
    const allRead: ForumNewMessageNotification[] = [
      {
        sk: 123,
        notificationType: 'forum.new_message',
        payload: { participantId: '1', itemId: '2', time: 1000, text: 'Read msg', authorId: '3', uuid: 'xyz' },
        readTime: 1000,
      },
    ];
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(allRead));
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('0');
  });

  it('should keep forum, ready and failed exports while ignoring unknown types', () => {
    const unknown: Notification = {
      sk: 999,
      notificationType: 'something.unknown',
      payload: { foo: 'bar' },
    };
    store.overrideSelector(
      fromNotification.selectNotificationsState,
      readyState([ ...mockForumNotifications, readyExportNotification, failedExportNotification, unknown ]),
    );
    store.refreshState();
    fixture.detectChanges();

    const state = component.notificationsState();
    expect(state.isReady).toBeTrue();
    if (state.isReady) {
      expect(state.data.map(n => n.notificationType)).toEqual([
        'forum.new_message',
        'forum.new_message',
        'group_results_export.ready',
        'group_results_export.failed',
      ]);
    }
    expect(component.readySummary(readyExportNotification)).toContain('Chapter 1');
  });

  it('should treat past and invalid expiresAt as expired', () => {
    expect(component.isExportLinkExpired(expiredExportNotification)).toBeTrue();
    expect(component.isExportLinkExpired(invalidExpiryNotification)).toBeTrue();
    expect(component.isExportLinkExpired(readyExportNotification)).toBeFalse();
    expect(component.isNotificationDisabled(expiredExportNotification)).toBeTrue();
    expect(component.isNotificationDisabled(failedExportNotification)).toBeTrue();
  });

  it('should download export on click via https open helper', () => {
    groupResultsExportService.getDownloadUrl.and.returnValue(of('https://cdn.example/file.zip'));
    const openSpy = spyOn(component, 'openDownloadUrl').and.returnValue(true);

    component.downloadExport(readyExportNotification);

    expect(groupResultsExportService.getDownloadUrl).toHaveBeenCalledWith('exp-1');
    expect(openSpy).toHaveBeenCalledWith('https://cdn.example/file.zip');
  });

  it('should not call getDownloadUrl for expired exports', () => {
    component.downloadExport(expiredExportNotification);
    expect(groupResultsExportService.getDownloadUrl).not.toHaveBeenCalled();
  });

  it('should ignore overlapping download while one is in flight', () => {
    const download$ = new Subject<string>();
    groupResultsExportService.getDownloadUrl.and.returnValue(download$.asObservable());

    component.downloadExport(readyExportNotification);
    component.downloadExport(readyExportNotification);

    expect(groupResultsExportService.getDownloadUrl).toHaveBeenCalledTimes(1);
    download$.next('https://cdn.example/file.zip');
    download$.complete();
  });

  it('should mark export expired in place on download-url 404', () => {
    groupResultsExportService.getDownloadUrl.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    component.downloadExport(readyExportNotification);

    expect(component.isExportLinkExpired(readyExportNotification)).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: jasmine.stringMatching(/expired/i),
    }));
  });

  it('should toast when openDownloadUrl rejects a non-https URL', () => {
    groupResultsExportService.getDownloadUrl.and.returnValue(of('http://insecure.example/x'));
    spyOn(component, 'openDownloadUrl').and.callThrough();

    component.downloadExport(readyExportNotification);

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: jasmine.stringMatching(/failed to download/i),
    }));
  });

  it('should report isFetching true when fetching', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, fetchingState());
    store.refreshState();
    fixture.detectChanges();
    expect(component.notificationsState().isFetching).toBeTrue();
  });

  it('should report isFetching false when ready', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(mockForumNotifications));
    store.refreshState();
    fixture.detectChanges();
    expect(component.notificationsState().isFetching).toBeFalse();
  });

  it('should dispatch showThread with fetched title when openThread is called', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;

    component.openThread(notification);

    expect(getItemByIdService.get).toHaveBeenCalledWith(notification.payload.itemId);
    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Test Item' },
      })
    );
  });

  it('should dispatch showThread with forbidden message when item fetch is forbidden', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;
    const forbiddenError = new HttpErrorResponse({ status: 403 });
    getItemByIdService.get.and.returnValue(throwError(() => forbiddenError));

    component.openThread(notification);

    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Not visible content' },
      })
    );
  });

  it('should dispatch showThread with error message when item fetch fails', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;
    const serverError = new HttpErrorResponse({ status: 500 });
    getItemByIdService.get.and.returnValue(throwError(() => serverError));

    component.openThread(notification);

    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Error fetching content title' },
      })
    );
  });
});
