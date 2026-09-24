import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { fromNotification } from '../../store/notification';
import { fetchingState, readyState, errorState } from 'src/app/utils/state';
import {
  ForumNewMessageNotification,
  GroupResultsExportFailedNotification,
  GroupResultsExportReadyNotification,
  Notification,
} from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { NotificationInteractionService } from 'src/app/services/notification-interaction.service';

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
  let notificationInteraction: jasmine.SpyObj<NotificationInteractionService>;

  beforeEach(async () => {
    notificationInteraction = jasmine.createSpyObj<NotificationInteractionService>(
      'NotificationInteractionService',
      [ 'activate$', 'clear$', 'isExportLinkExpired', 'isDownloading' ],
    );
    notificationInteraction.activate$.and.returnValue(of(undefined));
    notificationInteraction.clear$.and.returnValue(of(undefined));
    notificationInteraction.isExportLinkExpired.and.callFake(
      (n: GroupResultsExportReadyNotification) => n.payload.expiresAt <= Date.now(),
    );
    notificationInteraction.isDownloading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [ NotificationBellComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromNotification.selectNotificationsState, value: fetchingState() }
          ]
        }),
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } },
        { provide: NotificationHttpService, useValue: { deleteAllNotifications: () => of(undefined) } },
        { provide: NotificationInteractionService, useValue: notificationInteraction },
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

  it('should activate on row click for ready, failed, and forum', () => {
    component.onNotificationClick(readyExportNotification);
    component.onNotificationClick(failedExportNotification);
    component.onNotificationClick(mockForumNotifications[0]!);

    expect(notificationInteraction.activate$).toHaveBeenCalledWith(readyExportNotification);
    expect(notificationInteraction.activate$).toHaveBeenCalledWith(failedExportNotification);
    expect(notificationInteraction.activate$).toHaveBeenCalledWith(mockForumNotifications[0]!);
  });

  it('should clear without activating when trash is clicked', () => {
    const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', [ 'preventDefault', 'stopPropagation' ]);

    component.onClearClick(event, readyExportNotification);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(notificationInteraction.clear$).toHaveBeenCalledWith(200);
    expect(notificationInteraction.activate$).not.toHaveBeenCalled();
  });

  it('should enable failed rows and show a trash button for every notification', () => {
    store.overrideSelector(
      fromNotification.selectNotificationsState,
      readyState([ mockForumNotifications[0]!, readyExportNotification, failedExportNotification, expiredExportNotification ]),
    );
    store.refreshState();
    fixture.detectChanges();

    const trigger = fixture.debugElement.query(By.css('.bell-button'));
    trigger.triggerEventHandler('click');
    fixture.detectChanges();

    const rows = document.querySelectorAll('.notification-row');
    expect(rows.length).toBe(4);
    rows.forEach(row => {
      const item = row.querySelector('.notification-item');
      expect(item).toBeTruthy();
      expect(item?.getAttribute('aria-disabled')).toBeNull();
      expect(item?.classList.contains('disabled')).toBeFalse();
      const trash = row.querySelector('button.clear-button');
      expect(trash).toBeTruthy();
      expect(trash?.getAttribute('aria-label')).toBe('Clear notification');
      expect(trash?.getAttribute('type')).toBe('button');
      expect(item?.contains(trash)).toBeFalse();
    });
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
});
