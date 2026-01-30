import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { of, Subject, throwError } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { fromNotification } from '../../store/notification';
import { fromForum } from '../../forum/store';
import { fetchingState, readyState, errorState } from 'src/app/utils/state';
import { ForumNewMessageNotification } from 'src/app/models/notification';
import { MessageService } from 'src/app/services/message.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { HttpErrorResponse } from '@angular/common/http';

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

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let store: MockStore<object>;
  let actions$: Subject<unknown>;
  let getItemByIdService: jasmine.SpyObj<GetItemByIdService>;

  beforeEach(waitForAsync(() => {
    actions$ = new Subject<unknown>();
    getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', ['get']);
    getItemByIdService.get.and.returnValue(of({ string: { title: 'Test Item' } } as Item));

    TestBed.configureTestingModule({
      imports: [ NotificationBellComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromNotification.selectNotificationsState, value: fetchingState() }
          ]
        }),
        provideMockActions(() => actions$),
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } },
        { provide: GetItemByIdService, useValue: getItemByIdService },
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
  }));

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

  it('should filter to forum.new_message notifications only', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(mockForumNotifications));
    store.refreshState();
    fixture.detectChanges();
    const state = component.notificationsState();
    expect(state.isReady).toBeTrue();
    if (state.isReady) {
      expect(state.data.length).toEqual(2);
      expect(state.data[0]?.payload.text).toEqual('Hello');
    }
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

  it('should dispatch showThread with fetched title when openThread is called', fakeAsync(() => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;

    component.openThread(notification);
    tick();

    expect(getItemByIdService.get).toHaveBeenCalledWith(notification.payload.itemId);
    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Test Item' },
      })
    );
  }));

  it('should dispatch showThread with forbidden message when item fetch is forbidden', fakeAsync(() => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;
    const forbiddenError = new HttpErrorResponse({ status: 403 });
    getItemByIdService.get.and.returnValue(throwError(() => forbiddenError));

    component.openThread(notification);
    tick();

    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Not visible content' },
      })
    );
  }));

  it('should dispatch showThread with error message when item fetch fails', fakeAsync(() => {
    const dispatchSpy = spyOn(store, 'dispatch');
    const notification = mockForumNotifications[0]!;
    const serverError = new HttpErrorResponse({ status: 500 });
    getItemByIdService.get.and.returnValue(throwError(() => serverError));

    component.openThread(notification);
    tick();

    expect(dispatchSpy).toHaveBeenCalledWith(
      fromForum.notificationActions.showThread({
        id: { participantId: notification.payload.participantId, itemId: notification.payload.itemId },
        item: { route: itemRoute('activity', notification.payload.itemId), title: 'Error fetching content title' },
      })
    );
  }));
});
