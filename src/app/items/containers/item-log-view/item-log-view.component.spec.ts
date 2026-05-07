import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { EMPTY, of } from 'rxjs';
import { ItemLogViewComponent } from './item-log-view.component';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { ObservationInfo } from 'src/app/store/observation/models';

describe('ItemLogViewComponent.backLinkHeading', () => {
  let component: ItemLogViewComponent;
  let fixture: ComponentFixture<ItemLogViewComponent>;
  let store: MockStore<object>;

  const userObsInfo: ObservationInfo = {
    route: rawGroupRoute({ id: 'u1', isUser: true }),
    name: 'Alice',
    currentUserCanGrantAccess: false,
    currentUserWatchGroup: true,
  };

  const groupObsInfo: ObservationInfo = {
    route: rawGroupRoute({ id: 'g1', isUser: false }),
    name: 'Team Phoenix',
    currentUserCanGrantAccess: false,
    currentUserWatchGroup: true,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ ItemLogViewComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectBackLink, value: null },
            { selector: fromObservation.selectObservedGroupInfo, value: null },
            { selector: fromObservation.selectIsObserving, value: false },
            { selector: fromObservation.selectObservedGroupId, value: null },
            { selector: fromObservation.selectObservedGroupRoute, value: null },
          ],
        }),
        { provide: ActivityLogService, useValue: { getActivityLog: () => EMPTY } },
        { provide: UserSessionService, useValue: { userProfile$: of({ groupId: 'me' }) } },
        { provide: ActionFeedbackService, useValue: { error: jasmine.createSpy('error') } },
        { provide: ItemRouter, useValue: { url: () => undefined } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemLogViewComponent);
    component = fixture.componentInstance;
  });

  it('returns null when backLink is null', () => {
    store.overrideSelector(fromItemContent.selectBackLink, null);
    store.overrideSelector(fromObservation.selectObservedGroupInfo, userObsInfo);
    store.refreshState();
    expect(component.backLinkHeading()).toBeNull();
  });

  it('returns null when observedGroupInfo is null', () => {
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, null);
    store.refreshState();
    expect(component.backLinkHeading()).toBeNull();
  });

  it('uses the user phrasing when the observed group is a user', () => {
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, userObsInfo);
    store.refreshState();
    expect(component.backLinkHeading()).toBe('You are now on the history page of user Alice.');
  });

  it('uses the group phrasing when the observed group is a group', () => {
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, groupObsInfo);
    store.refreshState();
    expect(component.backLinkHeading()).toBe('You are now on the history page of group Team Phoenix.');
  });
});
