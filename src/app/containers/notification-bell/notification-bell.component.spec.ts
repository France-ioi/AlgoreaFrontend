import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { fromNotification } from '../../store/notification';
import { fetchingState, readyState, errorState } from 'src/app/utils/state';
import { Notification } from 'src/app/data-access/notification.service';

const mockNotifications: Notification[] = [
  { sk: 123, notificationType: 'test', payload: {}, readTime: undefined },
  { sk: 124, notificationType: 'test2', payload: {}, readTime: undefined },
];

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let store: MockStore<object>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ NotificationBellComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromNotification.selectNotificationsState, value: fetchingState() }
          ]
        })
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
    expect(component.isError()).toBeTrue();
  });

  it('should show count when has unread notifications', () => {
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(mockNotifications));
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('2');
  });

  it('should show 0 when no unread notifications', () => {
    const allRead: Notification[] = [
      { sk: 123, notificationType: 'test', payload: {}, readTime: 1000 }
    ];
    store.overrideSelector(fromNotification.selectNotificationsState, readyState(allRead));
    store.refreshState();
    fixture.detectChanges();
    expect(component.badgeText()).toEqual('0');
  });
});
