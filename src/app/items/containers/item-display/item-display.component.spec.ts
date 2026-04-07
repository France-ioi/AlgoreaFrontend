import { ComponentFixture, TestBed } from '@angular/core/testing';
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

const route = itemRoute('activity', '1', { attemptId: '0', path: [] });

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
  };
}

describe('ItemDisplayComponent – retry button', () => {
  let fixture: ComponentFixture<ItemDisplayComponent>;
  let component: ItemDisplayComponent;
  let mockTaskService: ReturnType<typeof createMockTaskService>;

  beforeEach(async () => {
    mockTaskService = createMockTaskService();

    await TestBed.configureTestingModule({
      imports: [ ItemDisplayComponent ],
      providers: [
        provideRouter([]),
        { provide: ActionFeedbackService, useValue: { error: jasmine.createSpy(), clear: jasmine.createSpy(), hasFeedback: false } },
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
            { provide: TaskSessionTrackerService, useValue: { init: jasmine.createSpy(), ngOnDestroy: jasmine.createSpy() } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ItemDisplayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('route', route);
    fixture.componentRef.setInput('url', 'http://example.com/task');
    fixture.detectChanges();
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
      fixture.componentRef.setInput('url', 'http://example.com/task');
      component.editingPermission = { canEdit: ItemEditPerm.None };
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
      fixture.componentRef.setInput('url', 'http://example.com/task');

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
