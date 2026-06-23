import {
  AfterViewChecked,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EMPTY, merge, of, Subject } from 'rxjs';
import { Location, AsyncPipe } from '@angular/common';
import {
  catchError,
  distinctUntilChanged,
  ignoreElements,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { TaskConfig, ItemTaskService } from '../../services/item-task.service';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { capitalize } from 'src/app/utils/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { TaskSessionTrackerService } from '../../services/task-session-tracker.service';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { DomSanitizer } from '@angular/platform-browser';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LTIDataSource } from 'src/app/lti/lti-datasource.service';
import { PublishResultsService } from '../../data-access/publish-result.service';
import { ItemPermWithEdit, ItemEditPerm, AllowsEditingAllItemPipe } from 'src/app/items/models/item-edit-permission';
import { ActivityNavTreeService } from 'src/app/services/navigation/item-nav-tree.service';
import { Router } from '@angular/router';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { GetBreadcrumbsFromRootsService } from 'src/app/data-access/get-breadcrumbs-from-roots.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { FullHeightContentDirective } from 'src/app/directives/full-height-content.directive';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Dialog } from '@angular/cdk/dialog';
import { UnlockedItemsModalComponent } from 'src/app/items/containers/unlocked-items-modal/unlocked-items-modal.component';
import { outputFromObservable, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { UnlockedItems } from 'src/app/items/data-access/grade.service';
import { itemDisplayIframeHeight$ } from './item-display-iframe-height';
import { createItemDisplaySideEffectSubscriptions } from './item-display-side-effects';

export interface TaskTab {
  name: string,
  view: string,
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrl: './item-display.component.scss',
  providers: [ ItemTaskService, ItemTaskInitService, ItemTaskAnswerService, ItemTaskViewsService, TaskSessionTrackerService ],
  imports: [
    FullHeightContentDirective,
    ErrorComponent,
    LoadingComponent,
    AsyncPipe,
    AllowsEditingAllItemPipe,
    ButtonComponent,
  ]
})
export class ItemDisplayComponent implements AfterViewChecked, OnDestroy {
  private router = inject(Router);
  private itemRouter = inject(ItemRouter);
  private location = inject(Location);
  private taskService = inject(ItemTaskService);
  private sanitizer = inject(DomSanitizer);
  private actionFeedbackService = inject(ActionFeedbackService);
  private publishResultService = inject(PublishResultsService);
  private activityNavTreeService = inject(ActivityNavTreeService);
  private breadcrumbsService = inject(GetBreadcrumbsFromRootsService);
  private ltiDataSource = inject(LTIDataSource);
  private sessionTracker = inject(TaskSessionTrackerService);
  private dialogService = inject(Dialog);

  route = input.required<FullItemRoute>();
  url = input.required<string>();
  editingPermission = input<ItemPermWithEdit>({ canEdit: ItemEditPerm.None });
  attemptId = input<string>();
  resultStartedAt = input<Date | null>(null);
  view = input<TaskTab['view']>();
  taskConfig = input<TaskConfig>({ readOnly: false, initialAnswer: undefined });
  savingAnswer = input(false);

  scoreChange = outputFromObservable(this.taskService.scoreChange$);
  skipSave = output<void>();
  refresh = output<void>();

  iframe = viewChild<ElementRef<HTMLIFrameElement>>('iframe');

  state$ = merge(
    this.taskService.loadedTask$.pipe(map(task => readyState(task))),
    this.taskService.initError$.pipe(map(e => errorState(e))),
    this.taskService.urlError$.pipe(map(e => errorState(e))),
    this.taskService.unknownError$.pipe(map(e => errorState(e))),
  ).pipe(startWith(fetchingState()));
  loadingComplete = outputFromObservable(this.state$.pipe(map(s => !s.isFetching), distinctUntilChanged()));
  initError$ = this.taskService.initError$;
  urlError$ = this.taskService.urlError$;
  unknownError$ = this.taskService.unknownError$;
  iframeSrc$ = this.taskService.iframeSrc$.pipe(
    map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)),
    catchError(() => EMPTY),
  );

  private destroyed$ = new Subject<void>();

  private metadata = this.taskService.task$.pipe(
    switchMap(task => task.getMetaData()),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );
  metadataError$ = this.metadata.pipe(ignoreElements(), catchError(err => of(err)));
  metadata$ = this.metadata.pipe(catchError(() => EMPTY)); /* never emit errors */

  editorUrl = outputFromObservable(this.metadata$.pipe(map(({ editorUrl }) => editorUrl)));
  disablePlatformProgress = outputFromObservable(this.metadata$.pipe(
    map(({ disablePlatformProgress }) => disablePlatformProgress ?? false),
  ));

  iframeHeight$ = itemDisplayIframeHeight$(this.metadata$, this.taskService);
  fullFrame$ = this.metadata$.pipe(map(({ autoHeight }) => autoHeight ?? false));
  fullFrame = outputFromObservable(this.fullFrame$);

  showTaskAnyway = signal(false);

  viewChange = outputFromObservable(this.taskService.activeView$);
  tabsChange = outputFromObservable(this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  ));

  private subscriptions = createItemDisplaySideEffectSubscriptions({
    taskService: this.taskService,
    actionFeedbackService: this.actionFeedbackService,
    publishResultService: this.publishResultService,
    ltiDataSource: this.ltiDataSource,
    activityNavTreeService: this.activityNavTreeService,
    router: this.router,
    itemRouter: this.itemRouter,
    location: this.location,
    breadcrumbsService: this.breadcrumbsService,
    route: () => this.route(),
    openUnlockedItemsDialog: items => this.openUnlockedItemsDialog(items),
  });

  errorMessage = $localize`:@@unknownError:An unknown error occurred. ` +
    $localize`:@@contactUs:If the problem persists, please contact us.`;

  constructor() {
    // Re-configure the task service when task identity inputs change (replaces ngOnChanges keyed logic).
    // Registered before showView below: configure must run first so the service has task identity
    // before a view switch is applied (same ordering as the former ngOnChanges block).
    toObservable(computed(() => ({ attemptId: this.attemptId(), taskConfig: this.taskConfig() })))
      .pipe(takeUntilDestroyed())
      .subscribe(({ attemptId, taskConfig }) => {
        this.taskService.configure(this.route(), this.url(), attemptId, taskConfig);
      });

    // Broader than the old ngOnChanges (attemptId-only) trigger; safe because TaskSessionTrackerService.init
    // no-ops once initialized (see its idempotency guard).
    toObservable(computed(() => ({
      attemptId: this.attemptId(),
      resultStartedAt: this.resultStartedAt(),
      readOnly: this.taskConfig().readOnly,
    })))
      .pipe(takeUntilDestroyed())
      .subscribe(({ attemptId, resultStartedAt, readOnly }) => {
        if (attemptId !== undefined && !readOnly) {
          this.sessionTracker.init(attemptId, resultStartedAt);
        }
      });

    // Active view is driven by the view input (runs after configure subscription above).
    toObservable(this.view)
      .pipe(takeUntilDestroyed())
      .subscribe(view => this.taskService.showView(view ?? 'task'));

    // Immutability guard: the provider tree assumes one task per component instance.
    // Violations throw asynchronously inside this subscription (not during change detection).
    let initialRouteId: string | undefined;
    let initialUrl: string | undefined;
    toObservable(computed(() => ({ id: this.route().id, url: this.url() })))
      .pipe(takeUntilDestroyed())
      .subscribe(({ id, url }) => {
        if (initialRouteId === undefined) {
          initialRouteId = id;
          initialUrl = url;
          return;
        }
        if (initialRouteId !== id) {
          throw new Error('this component does not support changing its route input');
        }
        if (initialUrl !== url) {
          throw new Error('this component does not support changing its url input');
        }
      });
  }

  // ngAfterViewChecked is required: iframe init depends on DOM presence timing (async src binding).
  ngAfterViewChecked(): void {
    const iframe = this.iframe();
    if (!iframe || this.taskService.initialized) return;
    this.taskService.initTask(iframe.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.actionFeedbackService.hasFeedback) this.actionFeedbackService.clear();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  saveAnswerAndState(): ReturnType<ItemTaskService['saveAnswerAndState']> {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    return this.taskService.saveAnswerAndState();
  }

  private getTabNameByView(view: string): string {
    switch (view) {
      case 'editor': return $localize`Solve`;
      case 'forum': return $localize`Forum`;
      case 'hints': return $localize`Hints`;
      case 'solution': return $localize`Solution`;
      case 'submission': return $localize`Submission`;
      case 'task': return $localize`Statement`;
      default: return capitalize(view);
    }
  }

  openUnlockedItemsDialog(items: UnlockedItems): void {
    this.dialogService.open(UnlockedItemsModalComponent, {
      data: items,
      autoFocus: undefined,
    });
  }
}
