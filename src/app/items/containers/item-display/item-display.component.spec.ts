import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { EMPTY, of, Subject } from 'rxjs';
import { ItemDisplayComponent } from './item-display.component';
import { ItemTaskService } from '../../services/item-task.service';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { TaskSessionTrackerService } from '../../services/task-session-tracker.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { PublishResultsService } from '../../data-access/publish-result.service';
import { ActivityNavTreeService } from 'src/app/services/navigation/item-nav-tree.service';
import { GetBreadcrumbsFromRootsService } from 'src/app/data-access/get-breadcrumbs-from-roots.service';
import { LTIDataSource } from 'src/app/lti/lti-datasource.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { provideRouter } from '@angular/router';
import { Task } from '../../api/task-proxy';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { By } from '@angular/platform-browser';
import { readyState } from 'src/app/utils/state';

const route = itemRoute('activity', '1', { attemptId: '0', path: [] });
const taskUrl = 'http://example.com/task';

function createMockTaskService(): Record<string, unknown> {
  return {
    loadedTask$: EMPTY,
    initError$: EMPTY,
    urlError$: EMPTY,
    unknownError$: EMPTY,
    iframeSrc$: EMPTY,
    task$: EMPTY,
    scoreChange$: EMPTY,
    hintError$: EMPTY,
    navigateTo$: EMPTY,
    views$: EMPTY,
    display$: EMPTY,
    activeView$: EMPTY,
    autoSaveResult$: EMPTY,
    unlockedItems$: EMPTY,
    initialized: false,
    configure: jasmine.createSpy('configure'),
    initTask: jasmine.createSpy('initTask'),
    showView: jasmine.createSpy('showView'),
    saveAnswerAndState: jasmine.createSpy('saveAnswerAndState').and.returnValue(of(readyState<void>(undefined))),
  };
}

interface ItemDisplayTestContext {
  fixture: ComponentFixture<ItemDisplayComponent>,
  component: ItemDisplayComponent,
  mockTaskService: ReturnType<typeof createMockTaskService>,
  mockSessionTracker: { init: jasmine.Spy, ngOnDestroy: jasmine.Spy },
  actionFeedbackService: { error: jasmine.Spy, clear: jasmine.Spy, hasFeedback: boolean },
}

async function setupItemDisplayTest(
  overrides: {
    hintError$?: Subject<void>,
    actionFeedbackService?: ItemDisplayTestContext['actionFeedbackService'],
  } = {},
): Promise<ItemDisplayTestContext> {
  const mockTaskService = createMockTaskService();
  if (overrides.hintError$) {
    mockTaskService['hintError$'] = overrides.hintError$.asObservable();
  }
  const mockSessionTracker = { init: jasmine.createSpy('init'), ngOnDestroy: jasmine.createSpy('ngOnDestroy') };
  const actionFeedbackService = overrides.actionFeedbackService ?? {
    error: jasmine.createSpy('error'),
    clear: jasmine.createSpy('clear'),
    hasFeedback: false,
  };

  await TestBed.configureTestingModule({
    imports: [ ItemDisplayComponent ],
    providers: [
      provideRouter([]),
      { provide: ActionFeedbackService, useValue: actionFeedbackService },
      { provide: PublishResultsService, useValue: {} },
      { provide: ActivityNavTreeService, useValue: { navigationNeighbors$: EMPTY } },
      { provide: GetBreadcrumbsFromRootsService, useValue: {} },
      { provide: LTIDataSource, useValue: { data: null } },
      { provide: ItemRouter, useValue: { url: () => [], navigateTo: jasmine.createSpy() } },
    ],
  })
    .overrideComponent(ItemDisplayComponent, {
      set: {
        providers: [
          { provide: ItemTaskService, useValue: mockTaskService },
          { provide: ItemTaskInitService, useValue: {} },
          { provide: ItemTaskAnswerService, useValue: {} },
          { provide: ItemTaskViewsService, useValue: {} },
          { provide: TaskSessionTrackerService, useValue: mockSessionTracker },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ItemDisplayComponent);
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('route', route);
  fixture.componentRef.setInput('url', taskUrl);
  fixture.detectChanges();

  return { fixture, component, mockTaskService, mockSessionTracker, actionFeedbackService };
}

function createIsolatedItemDisplayFixture(): ComponentFixture<ItemDisplayComponent> {
  const fixture = TestBed.createComponent(ItemDisplayComponent);
  fixture.componentRef.setInput('route', route);
  fixture.componentRef.setInput('url', taskUrl);
  fixture.detectChanges();
  return fixture;
}

describe('ItemDisplayComponent – constructor input effects', () => {
  let ctx: ItemDisplayTestContext;

  beforeEach(async () => {
    ctx = await setupItemDisplayTest();
  });

  it('should call configure on init with route, url, and taskConfig', () => {
    expect(ctx.mockTaskService.configure).toHaveBeenCalledWith(
      route,
      taskUrl,
      undefined,
      { readOnly: false, initialAnswer: undefined },
    );
  });

  it('should call configure when attemptId or taskConfig changes', () => {
    (ctx.mockTaskService.configure as jasmine.Spy).calls.reset();

    ctx.fixture.componentRef.setInput('attemptId', '42');
    ctx.fixture.detectChanges();
    expect(ctx.mockTaskService.configure).toHaveBeenCalledWith(
      route,
      taskUrl,
      '42',
      { readOnly: false, initialAnswer: undefined },
    );

    ctx.fixture.componentRef.setInput('taskConfig', { readOnly: true, initialAnswer: 'saved' });
    ctx.fixture.detectChanges();
    expect(ctx.mockTaskService.configure).toHaveBeenCalledWith(
      route,
      taskUrl,
      '42',
      { readOnly: true, initialAnswer: 'saved' },
    );
  });

  it('should call showView with task on init and when view input changes', () => {
    expect(ctx.mockTaskService.showView).toHaveBeenCalledWith('task');

    (ctx.mockTaskService.showView as jasmine.Spy).calls.reset();
    ctx.fixture.componentRef.setInput('view', 'editor');
    ctx.fixture.detectChanges();
    expect(ctx.mockTaskService.showView).toHaveBeenCalledWith('editor');
  });

  it('should init session tracking when attemptId is set for non-readOnly tasks', () => {
    const startedAt = new Date('2024-01-01');
    ctx.fixture.componentRef.setInput('attemptId', '7');
    ctx.fixture.componentRef.setInput('resultStartedAt', startedAt);
    ctx.fixture.detectChanges();

    expect(ctx.mockSessionTracker.init).toHaveBeenCalledWith('7', startedAt);
  });

  it('should not init session tracking for readOnly tasks', () => {
    ctx.fixture.componentRef.setInput('taskConfig', { readOnly: true, initialAnswer: 'x' });
    ctx.fixture.componentRef.setInput('attemptId', '7');
    ctx.fixture.detectChanges();

    expect(ctx.mockSessionTracker.init).not.toHaveBeenCalled();
  });

  it('should throw when route id changes after initialization', fakeAsync(() => {
    const isolated = createIsolatedItemDisplayFixture();
    const otherRoute = itemRoute('activity', '2', { attemptId: '0', path: [] });
    isolated.componentRef.setInput('route', otherRoute);
    expect(() => flush()).toThrowError('this component does not support changing its route input');
  }));

  it('should throw when url changes after initialization', fakeAsync(() => {
    const isolated = createIsolatedItemDisplayFixture();
    isolated.componentRef.setInput('url', 'http://example.com/other-task');
    expect(() => flush()).toThrowError('this component does not support changing its url input');
  }));
});

describe('ItemDisplayComponent – saveAnswerAndState', () => {
  let ctx: ItemDisplayTestContext;
  let hintErrorSubject: Subject<void>;

  beforeEach(async () => {
    hintErrorSubject = new Subject();
    ctx = await setupItemDisplayTest({ hintError$: hintErrorSubject });
  });

  it('should unsubscribe side-effect subscriptions before delegating to the task service', () => {
    hintErrorSubject.next();
    expect(ctx.actionFeedbackService.error).toHaveBeenCalledTimes(1);

    void ctx.component.saveAnswerAndState();
    expect(ctx.mockTaskService.saveAnswerAndState).toHaveBeenCalledTimes(1);
    (ctx.actionFeedbackService.error as jasmine.Spy).calls.reset();

    hintErrorSubject.next();
    expect(ctx.actionFeedbackService.error).not.toHaveBeenCalled();
  });
});

describe('ItemDisplayComponent – retry button', () => {
  let fixture: ComponentFixture<ItemDisplayComponent>;
  let component: ItemDisplayComponent;
  let mockTaskService: ReturnType<typeof createMockTaskService>;

  beforeEach(async () => {
    const ctx = await setupItemDisplayTest();
    fixture = ctx.fixture;
    component = ctx.component;
    mockTaskService = ctx.mockTaskService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in fetching state', () => {
    let emittedState: { isFetching: boolean } | undefined;
    component.state$.subscribe(s => emittedState = s);
    expect(emittedState?.isFetching).toBeTrue();
  });

  it('should not show error-container when in fetching state', () => {
    const errorContainer = fixture.debugElement.query(By.css('.error-container'));
    expect(errorContainer).toBeFalsy();
  });

  describe('when in error state', () => {
    let initErrorSubject: Subject<unknown>;

    beforeEach(() => {
      initErrorSubject = new Subject();
      mockTaskService['initError$'] = initErrorSubject.asObservable();

      fixture = TestBed.createComponent(ItemDisplayComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('route', route);
      fixture.componentRef.setInput('url', taskUrl);
      fixture.componentRef.setInput('editingPermission', { canEdit: ItemEditPerm.None });
      fixture.detectChanges();

      initErrorSubject.next(new Error('timeout'));
      fixture.detectChanges();
    });

    it('should show error-container', () => {
      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
    });

    it('should show the Retry button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.error-button'));
      const retryButton = buttons.find(btn => (btn.nativeElement as HTMLButtonElement).textContent?.trim() === 'Retry');
      expect(retryButton).toBeTruthy();
    });

    it('should emit refresh when Retry button is clicked', () => {
      let refreshEmitted = false;
      component.refresh.subscribe(() => refreshEmitted = true);

      const buttons = fixture.debugElement.queryAll(By.css('.error-button'));
      const retryButton = buttons.find(btn => (btn.nativeElement as HTMLButtonElement).textContent?.trim() === 'Retry');
      (retryButton?.nativeElement as HTMLButtonElement).click();

      expect(refreshEmitted).toBeTrue();
    });
  });

  describe('when task loads successfully', () => {
    let loadedTaskSubject: Subject<Task>;
    let loadingCompleteValues: boolean[];

    beforeEach(() => {
      loadedTaskSubject = new Subject();
      mockTaskService['loadedTask$'] = loadedTaskSubject.asObservable();

      fixture = TestBed.createComponent(ItemDisplayComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('route', route);
      fixture.componentRef.setInput('url', taskUrl);

      loadingCompleteValues = [];
      component.loadingComplete.subscribe(v => loadingCompleteValues.push(v));

      fixture.detectChanges();

      const mockTask = jasmine.createSpyObj<Task>('Task', [ 'getMetaData', 'load', 'updateToken', 'destroy', 'bindPlatform' ]);
      mockTask.getMetaData.and.returnValue(of({ usesTokens: false }));
      loadedTaskSubject.next(mockTask);
      fixture.detectChanges();
    });

    it('should not show error-container', () => {
      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeFalsy();
    });

    it('should emit loadingComplete as false then true', () => {
      expect(loadingCompleteValues).toEqual([ false, true ]);
    });
  });
});
