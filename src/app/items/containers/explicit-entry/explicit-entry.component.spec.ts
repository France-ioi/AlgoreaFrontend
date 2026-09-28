import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ExplicitEntryComponent } from './explicit-entry.component';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { AttemptActionsService } from 'src/app/data-access/attempt-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemData } from '../../models/item-data';
import { itemRoute, newAttemptId } from 'src/app/models/routing/item-route';
import { mockItem } from '../../mocks/item-by-id';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fromItemContent } from '../../store';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { Duration } from 'src/app/utils/duration';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { Item } from 'src/app/data-access/get-item-by-id.service';

const mockRoute = itemRoute('activity', 'activity-1', { parentAttemptId: '0', path: [] });

const mockItemData: ItemData = {
  route: mockRoute,
  item: { ...mockItem, id: 'activity-1', requiresExplicitEntry: true },
  breadcrumbs: [],
};

function contentViewerItem(overrides: Partial<Item> = {}): Item {
  return {
    ...mockItem,
    id: 'activity-1',
    requiresExplicitEntry: true,
    permissions: {
      ...mockItem.permissions,
      canView: ItemViewPerm.Content,
    },
    ...overrides,
  };
}

function contentViewerItemData(overrides: Partial<Item> = {}): ItemData {
  return {
    route: mockRoute,
    item: contentViewerItem(overrides),
    breadcrumbs: [],
  };
}

describe('ExplicitEntryComponent', () => {
  let fixture: ComponentFixture<ExplicitEntryComponent>;
  let component: ExplicitEntryComponent;
  let itemEntryService: jasmine.SpyObj<Pick<ItemEntryService, 'getEntryState' | 'enter'>>;
  let attemptActions: jasmine.SpyObj<Pick<AttemptActionsService, 'create'>>;
  let itemRouter: jasmine.SpyObj<Pick<ItemRouter, 'navigateTo' | 'url'>>;
  let actionFeedbackService: jasmine.SpyObj<Pick<ActionFeedbackService, 'success' | 'error'>>;
  let store: MockStore;

  beforeEach(async () => {
    itemEntryService = jasmine.createSpyObj('ItemEntryService', [ 'getEntryState', 'enter' ]);
    attemptActions = jasmine.createSpyObj('AttemptActionsService', [ 'create' ]);
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
        { provide: AttemptActionsService, useValue: attemptActions },
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

  function setItemData(itemData: ItemData): void {
    fixture = TestBed.createComponent(ExplicitEntryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', itemData);
    fixture.detectChanges();
  }

  function buttonTexts(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .map(button => (button.textContent ?? '').trim());
  }

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
      setItemData({ ...mockItemData, route });

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
      setItemData(mockItemData);

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Please refresh the page');
      expect(fixture.nativeElement.querySelector('a.alg-link')).toBeNull();
    });

    it('shows attempts-tab advice and hides Start for a content viewer on a single-attempt item', () => {
      const route = itemRoute('activity', 'activity-1', {
        parentAttemptId: '0',
        path: [],
        attemptId: newAttemptId,
      });
      setItemData({ ...contentViewerItemData(), route });

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('attempts tab');
      expect(buttonTexts()).not.toContain('Start this activity');
      expect(text).not.toContain('This content requires manual entry');
    });
  });

  describe('direct start for content viewers', () => {
    it('shows start button and hides Enter now for a content viewer with a single attempt', () => {
      setItemData(contentViewerItemData());

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('This content requires manual entry.');
      expect(text).not.toContain('including for editing children');
      expect(buttonTexts()).toContain('Start this activity');
      expect(buttonTexts()).not.toContain('Enter now');
    });

    it('includes editing-children phrase when can_edit >= children', () => {
      setItemData(contentViewerItemData({
        permissions: {
          ...mockItem.permissions,
          canView: ItemViewPerm.Content,
          canEdit: ItemEditPerm.Children,
        },
      }));

      expect(fixture.nativeElement.textContent).toContain(
        'This content requires manual entry (including for editing children).',
      );
    });

    it('omits editing-children phrase when can_edit is none', () => {
      setItemData(contentViewerItemData());

      expect(fixture.nativeElement.textContent).not.toContain('including for editing children');
    });

    it('shows both buttons when allowsMultipleAttempts', () => {
      setItemData(contentViewerItemData({ allowsMultipleAttempts: true }));

      const texts = buttonTexts();
      expect(texts).toContain('Start this activity');
      expect(texts).toContain('Enter now');
    });

    it('uses the without-time-constraints label for time-limited items', () => {
      setItemData(contentViewerItemData({
        duration: Duration.fromSeconds(3600),
      }));

      expect(buttonTexts()).toContain('Start this activity without time constraints');
      expect(buttonTexts()).not.toContain('Start this activity');
    });

    it('does not show the start button for an info-only viewer', () => {
      setItemData({
        route: mockRoute,
        item: {
          ...mockItem,
          id: 'activity-1',
          requiresExplicitEntry: true,
          permissions: {
            ...mockItem.permissions,
            canView: ItemViewPerm.Info,
          },
        },
        breadcrumbs: [],
      });

      const text = fixture.nativeElement.textContent as string;
      expect(text).not.toContain('This content requires manual entry');
      expect(buttonTexts()).not.toContain('Start this activity');
      expect(buttonTexts()).toContain('Enter now');
    });

    it('shows regular entry (not blank) for a content viewer on a Skill', () => {
      setItemData(contentViewerItemData({ type: 'Skill' }));

      const text = fixture.nativeElement.textContent as string;
      expect(text).not.toContain('This content requires manual entry');
      expect(buttonTexts()).not.toContain('Start this activity');
      expect(buttonTexts()).toContain('Enter now');
    });
  });

  describe('startDirectly', () => {
    beforeEach(() => {
      setItemData(contentViewerItemData());
    });

    afterEach(() => {
      try {
        jasmine.clock().uninstall();
      } catch {
        // Clock was not installed in this test.
      }
    });

    it('creates an attempt, dispatches attemptStarted with infinite allowsSubmissionsUntil, navigates, and emits refresh', () => {
      const attemptId = '42';
      attemptActions.create.and.returnValue(of(attemptId));
      const itemRefreshRequiredSpy = spyOn(component.itemRefreshRequired, 'emit');
      jasmine.clock().install();
      const now = new Date('2024-06-15T12:00:00Z');
      jasmine.clock().mockDate(now);

      component.startDirectly(mockRoute);

      expect(attemptActions.create).toHaveBeenCalledOnceWith([ 'activity-1' ], '0');
      expect(store.dispatch).toHaveBeenCalledOnceWith(
        fromItemContent.itemByIdPageActions.attemptStarted({
          result: {
            attemptId,
            startedAt: now,
            endedAt: null,
            latestActivityAt: now,
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
      expect(component.actionInProgress()).toBeTrue();
    });

    it('shows an error toast and resets progress when create fails', () => {
      attemptActions.create.and.returnValue(throwError(() => new Error('create failed')));
      const itemRefreshRequiredSpy = spyOn(component.itemRefreshRequired, 'emit');

      component.startDirectly(mockRoute);

      expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to start this activity');
      expect(itemRouter.navigateTo).not.toHaveBeenCalled();
      expect(itemRefreshRequiredSpy).not.toHaveBeenCalled();
      expect(component.actionInProgress()).toBeFalse();
    });

    it('shows an error toast and does not call create when the route has no parentAttemptId', () => {
      const routeWithoutParent = itemRoute('activity', 'activity-1', {
        attemptId: newAttemptId,
        path: [],
      });

      component.startDirectly(routeWithoutParent);

      expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to start this activity');
      expect(attemptActions.create).not.toHaveBeenCalled();
      expect(itemRouter.navigateTo).not.toHaveBeenCalled();
      expect(component.actionInProgress()).toBeFalse();
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
    expect(component.actionInProgress()).toBeTrue();
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
    expect(component.actionInProgress()).toBeFalse();
  });
});
