import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ProgressData, UserProgressDetailsComponent } from './user-progress-details.component';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from 'src/app/items/store';
import { UserSessionService } from 'src/app/services/user-session.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { ObservationInfo } from 'src/app/store/observation/models';

describe('UserProgressDetailsComponent.onViewHistory', () => {
  let component: UserProgressDetailsComponent;
  let fixture: ComponentFixture<UserProgressDetailsComponent>;
  let store: MockStore<object>;
  let dispatchSpy: jasmine.Spy;

  const observedGroup: ObservationInfo = {
    route: rawGroupRoute({ id: 'g1', isUser: false }),
    name: 'Team Phoenix',
    currentUserCanGrantAccess: false,
    currentUserWatchGroup: true,
  };

  const fakeProgressData: ProgressData = {
    progress: {
      groupId: 'u1',
      itemId: 'i1',
      score: 0,
      timeSpent: 0,
      hintsRequested: 0,
      submissions: 0,
      latestActivityAt: null,
      type: 'user',
      validated: false,
    },
    colItem: {
      type: 'Task',
      fullRoute: itemRoute('activity', 'i1', { attemptId: 'a1', path: [] }),
      permissions: { canView: 'content', canWatch: 'result' } as ProgressData['colItem']['permissions'],
    },
    rowGroup: { id: 'u1', isUser: true },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ UserProgressDetailsComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromObservation.selectObservedGroupInfo, value: null },
          ],
        }),
        { provide: UserSessionService, useValue: { userProfile$: of({ groupId: 'me' }) } },
        { provide: Router, useValue: { url: '/source-url' } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
    dispatchSpy = spyOn(store, 'dispatch');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProgressDetailsComponent);
    component = fixture.componentInstance;
  });

  it('does not dispatch when progressData is missing', () => {
    component.progressData = undefined;
    store.overrideSelector(fromObservation.selectObservedGroupInfo, observedGroup);
    store.refreshState();

    component.onViewHistory();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch when observedGroupInfo is null', () => {
    component.progressData = fakeProgressData;
    store.overrideSelector(fromObservation.selectObservedGroupInfo, null);
    store.refreshState();
    fixture.detectChanges();

    component.onViewHistory();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('dispatches registerBackLink with router.url and the observed group name', () => {
    component.progressData = fakeProgressData;
    store.overrideSelector(fromObservation.selectObservedGroupInfo, observedGroup);
    store.refreshState();
    fixture.detectChanges();

    component.onViewHistory();

    expect(dispatchSpy).toHaveBeenCalledOnceWith(
      fromItemContent.sourcePageActions.registerBackLink({
        backLink: {
          url: '/source-url',
          label: 'Return to Team Phoenix group stats',
        },
      })
    );
  });
});
