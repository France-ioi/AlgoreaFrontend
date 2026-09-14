import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ExplicitEntryComponent } from './explicit-entry.component';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemData } from '../../models/item-data';
import { itemRoute, newAttemptId } from 'src/app/models/routing/item-route';
import { mockItem } from '../../mocks/item-by-id';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fromItemContent } from '../../store';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { Duration } from 'src/app/utils/duration';

const mockRoute = itemRoute('activity', 'activity-1', { parentAttemptId: '0', path: [] });

const mockItemData: ItemData = {
  route: mockRoute,
  item: { ...mockItem, id: 'activity-1', requiresExplicitEntry: true },
  breadcrumbs: [],
};

describe('ExplicitEntryComponent', () => {
  let fixture: ComponentFixture<ExplicitEntryComponent>;
  let component: ExplicitEntryComponent;
  let itemEntryService: jasmine.SpyObj<Pick<ItemEntryService, 'getEntryState' | 'enter'>>;
  let itemRouter: jasmine.SpyObj<Pick<ItemRouter, 'navigateTo' | 'url'>>;
  let actionFeedbackService: jasmine.SpyObj<Pick<ActionFeedbackService, 'success' | 'error'>>;
  let store: MockStore;

  beforeEach(async () => {
    itemEntryService = jasmine.createSpyObj('ItemEntryService', [ 'getEntryState', 'enter' ]);
    itemRouter = jasmine.createSpyObj('ItemRouter', [ 'navigateTo', 'url' ]);
    actionFeedbackService = jasmine.createSpyObj('ActionFeedbackService', [ 'success', 'error' ]);

    itemEntryService.getEntryState.and.returnValue(of({
      currentUserCanEnter: true,
      state: 'ready',
    }));
    itemRouter.url.and.returnValue('/a/activity-1;a=new/attempts' as never);

    await TestBed.configureTestingModule({
      imports: [ ExplicitEntryComponent ],
      providers: [
        provideRouter([]),
        provideMockStore(),
        { provide: ItemEntryService, useValue: itemEntryService },
        { provide: ItemRouter, useValue: itemRouter },
        { provide: ActionFeedbackService, useValue: actionFeedbackService },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(ExplicitEntryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', mockItemData);
    fixture.detectChanges();
  });

  describe('already_started advice', () => {
    beforeEach(() => {
      itemEntryService.getEntryState.and.returnValue(of({
        currentUserCanEnter: false,
        state: 'already_started',
      }));
    });

    it('links to the attempts tab when a=new is in the route', () => {
      const route = itemRoute('activity', 'activity-1', {
        parentAttemptId: '0',
        path: [],
        attemptId: newAttemptId,
      });
      fixture = TestBed.createComponent(ExplicitEntryComponent);
      fixture.componentRef.setInput('itemData', { ...mockItemData, route });
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('attempts tab');
      expect(text).not.toContain('refresh the page');
      expect(fixture.nativeElement.querySelector('a.alg-link')).toBeTruthy();
      expect(itemRouter.url).toHaveBeenCalledWith(
        jasmine.objectContaining({ attemptId: newAttemptId }),
        [ 'attempts' ],
      );
    });

    it('asks to refresh when a=new is not in the route', () => {
      fixture = TestBed.createComponent(ExplicitEntryComponent);
      fixture.componentRef.setInput('itemData', mockItemData);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Please refresh the page');
      expect(fixture.nativeElement.querySelector('a.alg-link')).toBeNull();
    });
  });

  it('dispatches attemptStarted then navigates with a=NEW keeping pa', () => {
    const attemptId = '42';
    const enteredAt = new Date('2024-01-01T00:00:00Z');
    itemEntryService.enter.and.returnValue(of({
      attemptId,
      duration: null,
      enteredAt,
    }));
    const itemRefreshRequiredSpy = spyOn(component.itemRefreshRequired, 'emit');

    component.enterActivity(mockRoute);

    expect(store.dispatch).toHaveBeenCalledOnceWith(
      fromItemContent.itemByIdPageActions.attemptStarted({
        result: {
          attemptId,
          startedAt: enteredAt,
          endedAt: null,
          latestActivityAt: enteredAt,
          score: 0,
          validated: false,
          allowsSubmissionsUntil: new Date(backendInfiniteDateString),
        },
      }),
    );
    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...mockRoute, attemptId },
      { useCurrentObservation: true },
    );
    expect(itemRefreshRequiredSpy).toHaveBeenCalledTimes(1);
    expect(component.enterActivityInProgress()).toBeTrue();
  });

  it('synthesizes allowsSubmissionsUntil from duration when present', () => {
    const attemptId = '99';
    const enteredAt = new Date('2024-01-01T00:00:00Z');
    const duration = Duration.fromSeconds(3600);
    itemEntryService.enter.and.returnValue(of({
      attemptId,
      duration,
      enteredAt,
    }));

    component.enterActivity(mockRoute);

    const action = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<
      typeof fromItemContent.itemByIdPageActions.attemptStarted
    >;
    expect(action.result.attemptId).toBe(attemptId);
    expect(action.result.allowsSubmissionsUntil).toEqual(
      new Date(enteredAt.getTime() + duration.getMs()),
    );
  });

  it('overrides an existing self attemptId on re-entry while keeping parentAttemptId', () => {
    const routeWithStaleAttempt = itemRoute('activity', 'activity-1', {
      attemptId: 'old',
      parentAttemptId: '0',
      path: [],
    });
    const attemptId = '99';
    itemEntryService.enter.and.returnValue(of({
      attemptId,
      duration: null,
      enteredAt: new Date(),
    }));

    component.enterActivity(routeWithStaleAttempt);

    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...routeWithStaleAttempt, attemptId },
      { useCurrentObservation: true },
    );
  });

  it('should show an error toast and reset progress when enter fails', () => {
    itemEntryService.enter.and.returnValue(throwError(() => new Error('enter failed')));
    const itemRefreshRequiredSpy = spyOn(component.itemRefreshRequired, 'emit');

    component.enterActivity(mockRoute);

    expect(actionFeedbackService.error).toHaveBeenCalledTimes(1);
    expect(itemRouter.navigateTo).not.toHaveBeenCalled();
    expect(itemRefreshRequiredSpy).not.toHaveBeenCalled();
    expect(component.enterActivityInProgress()).toBeFalse();
  });
});
