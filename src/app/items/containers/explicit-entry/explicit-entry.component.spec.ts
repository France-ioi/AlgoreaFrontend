import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExplicitEntryComponent } from './explicit-entry.component';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemData } from '../../models/item-data';
import { itemRoute } from 'src/app/models/routing/item-route';
import { mockItem } from '../../mocks/item-by-id';

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
  let itemRouter: jasmine.SpyObj<Pick<ItemRouter, 'navigateTo'>>;
  let actionFeedbackService: jasmine.SpyObj<Pick<ActionFeedbackService, 'success' | 'error'>>;

  beforeEach(async () => {
    itemEntryService = jasmine.createSpyObj('ItemEntryService', [ 'getEntryState', 'enter' ]);
    itemRouter = jasmine.createSpyObj('ItemRouter', [ 'navigateTo' ]);
    actionFeedbackService = jasmine.createSpyObj('ActionFeedbackService', [ 'success', 'error' ]);

    itemEntryService.getEntryState.and.returnValue(of({
      currentUserCanEnter: true,
      state: 'ready',
    }));

    await TestBed.configureTestingModule({
      imports: [ ExplicitEntryComponent ],
      providers: [
        { provide: ItemEntryService, useValue: itemEntryService },
        { provide: ItemRouter, useValue: itemRouter },
        { provide: ActionFeedbackService, useValue: actionFeedbackService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExplicitEntryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', mockItemData);
    fixture.detectChanges();
  });

  it('should navigate to the entered attempt and emit itemRefreshRequired on success', () => {
    const attemptId = '42';
    itemEntryService.enter.and.returnValue(of({
      attemptId,
      duration: null,
      enteredAt: new Date(),
    }));
    const itemRefreshRequiredSpy = spyOn(component.itemRefreshRequired, 'emit');

    component.enterActivity(mockRoute);

    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...mockRoute, attemptId },
      { useCurrentObservation: true },
    );
    expect(itemRefreshRequiredSpy).toHaveBeenCalledTimes(1);
    expect(component.enterActivityInProgress()).toBeTrue();
  });

  it('should override an existing self attemptId on successful re-entry', () => {
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
