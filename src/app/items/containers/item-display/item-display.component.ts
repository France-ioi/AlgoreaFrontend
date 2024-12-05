import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { EMPTY, interval, Observable, merge, of, Subject } from 'rxjs';
import { Location, NgIf, NgClass, AsyncPipe } from '@angular/common';
import {
  catchError,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import { HOURS, SECONDS } from 'src/app/utils/duration';
import { TaskConfig, ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { capitalize } from 'src/app/utils/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { FullItemRoute, itemRoute } from 'src/app/models/routing/item-route';
import { DomSanitizer } from '@angular/platform-browser';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LTIDataSource } from 'src/app/lti/lti-datasource.service';
import { PublishResultsService } from '../../data-access/publish-result.service';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemPermWithEdit, ItemEditPerm, AllowsEditingAllItemPipe } from 'src/app/items/models/item-edit-permission';
import { ActivityNavTreeService } from 'src/app/services/navigation/item-nav-tree.service';
import { Router } from '@angular/router';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { openNewTab, replaceWindowUrl } from 'src/app/utils/url';
import { GetBreadcrumbsFromRootsService } from 'src/app/data-access/get-breadcrumbs-from-roots.service';
import { typeCategoryOfItem } from 'src/app/items/models/item-type';
import { closestBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ButtonModule } from 'primeng/button';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { FullHeightContentDirective } from 'src/app/directives/full-height-content.directive';

export interface TaskTab {
  name: string,
  view: string,
}

const heightSyncInterval = 0.2*SECONDS;

@Component({
  selector: 'alg-item-display[url][route]',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ],
  providers: [ ItemTaskService, ItemTaskInitService, ItemTaskAnswerService, ItemTaskViewsService ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FullHeightContentDirective,
    ErrorComponent,
    ButtonModule,
    LoadingComponent,
    AsyncPipe,
    AllowsEditingAllItemPipe,
  ],
})
export class ItemDisplayComponent implements AfterViewChecked, OnChanges, OnDestroy {
  @Input() route!: FullItemRoute;
  @Input() url!: string;
  @Input() editingPermission: ItemPermWithEdit = { canEdit: ItemEditPerm.None };
  @Input() attemptId?: string;
  @Input() view?: TaskTab['view'];
  @Input() taskConfig: TaskConfig = { readOnly: false, initialAnswer: undefined };
  @Input() savingAnswer = false;

  @Output() scoreChange = this.taskService.scoreChange$;
  @Output() skipSave = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = merge(this.taskService.loadedTask$, this.taskService.error$).pipe(mapToFetchState());
  @Output() loadingComplete = this.state$.pipe(map(s => !s.isFetching), distinctUntilChanged());
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

  @Output() editorUrl = this.metadata$.pipe(map(({ editorUrl }) => editorUrl));
  @Output() disablePlatformProgress = this.metadata$.pipe(map(({ disablePlatformProgress }) => disablePlatformProgress ?? false));

  iframeHeight$ = this.metadata$.pipe(
    switchMap(({ autoHeight }) => {
      if (autoHeight) return of(undefined);
      return merge(
        this.taskService.task$.pipe(
          switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight().pipe(catchError(() => EMPTY)))))
        ),
        this.taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
      ).pipe(map(height => `${height}px`));
    }),
    distinctUntilChanged(),
  );
  fullFrame$ = this.metadata$.pipe(
    map(({ autoHeight }) => autoHeight)
  );
  @Output() fullFrame = this.fullFrame$;

  showTaskAnyway = false;

  @Output() viewChange = this.taskService.activeView$;
  @Output() tabsChange: Observable<TaskTab[]> = this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  );

  private subscriptions = [
    this.taskService.autoSaveResult$
      .pipe(startWith(true), pairwise())
      .subscribe(([ previous, next ]) => {
        const shouldDisplayError = !next && !this.actionFeedbackService.hasFeedback;
        const shouldDisplaySuccess = !previous && next;
        if (shouldDisplayError) {
          const message = $localize`Your current progress could not have been saved. Are you connected to the internet?`;
          this.actionFeedbackService.error(message, { life: 24*HOURS });
        }
        if (shouldDisplaySuccess) {
          this.actionFeedbackService.clear();
          this.actionFeedbackService.success($localize`Progress saved!`);
        }
      }),

    this.scoreChange.pipe(
      switchMap(() => {
        if (!this.ltiDataSource.data) return EMPTY;
        return this.publishResultService.publish(this.ltiDataSource.data.contentId, this.ltiDataSource.data.attemptId);
      }),
    ).subscribe({
      error: err => {
        const message = errorIsHTTPForbidden(err)
          ? $localize`You might be unauthenticated anymore, please try relaunching the exercise. If the problem persits contact us.`
          : $localize`An unknown error occurred while publishing your result`;
        this.actionFeedbackService.error(message, { life: 10*SECONDS });
      }
    }),

    this.taskService.hintError$.subscribe(() => this.actionFeedbackService.error($localize`Hint request failed`)),

    // case "navigation to next"
    this.taskService.navigateTo$.pipe(
      filter(dst => 'nextActivity' in dst),
      withLatestFrom(this.activityNavTreeService.navigationNeighbors$.pipe(readyData())),
    ).subscribe(([ , navNeighbors ]) => (navNeighbors?.next ?? navNeighbors?.parent)?.navigateTo()),

    // case "navigation for known target"
    this.taskService.navigateTo$.pipe(
      filter((d): d is ({ id: string, path: string[] }|{ url: string })&{ newTab: boolean} => 'url' in d || ('id' in d && !!d.path))
    ).subscribe(dst => {
      if ('id' in dst) {
        const route = itemRoute('activity', dst.id, { path: dst.path });
        if (dst.newTab) openNewTab(this.router.serializeUrl(this.itemRouter.url(route)), this.location);
        else this.itemRouter.navigateTo(route);
      }
      if ('url' in dst) {
        if (dst.newTab) openNewTab(dst.url, this.location);
        else replaceWindowUrl(dst.url, this.location);
      }
    }),

    // case "navigation to item without path"
    this.taskService.navigateTo$.pipe(
      filter((dst): dst is ({ id: string }|{ textId: string })&{ newTab: boolean} => ('id' in dst && !dst.path) || 'textId' in dst),
      switchMap(dst => {
        const getBreadcrumbs$ = 'id' in dst ? this.breadcrumbsService.get(dst.id) : this.breadcrumbsService.getByTextId(dst.textId);
        return getBreadcrumbs$.pipe(map(breadcrumbs => ({ breadcrumbs, newTab: dst.newTab })), mapToFetchState());
      }),
    ).subscribe(state => {
      if (state.isError) {
        if (errorIsHTTPForbidden(state.error)) this.actionFeedbackService.error($localize`You cannot access this page.`);
        else this.actionFeedbackService.error($localize`Unable to get linked page information. If the problem persists, contact us.`);
      }
      if (state.isReady) {
        const breadcrumbs = closestBreadcrumbs(this.route.path, state.data.breadcrumbs); // choose the closest, TODO: ask the user instead
        const lastElement = breadcrumbs.pop();
        if (!lastElement) throw new Error('unexpected: get all breadcrumbs services are expected to return non-empty breadcrumbs');
        const route = itemRoute(typeCategoryOfItem(lastElement), lastElement.id, { path: breadcrumbs.map(b => b.id) });
        if (state.data.newTab) openNewTab(this.router.serializeUrl(this.itemRouter.url(route)), this.location);
        else this.itemRouter.navigateTo(route);
      }
    }),
  ];

  errorMessage = $localize`:@@unknownError:An unknown error occurred. ` +
    $localize`:@@contactUs:If the problem persists, please contact us.`;

  constructor(
    private router: Router,
    private itemRouter: ItemRouter,
    private location: Location,
    private taskService: ItemTaskService,
    private sanitizer: DomSanitizer,
    private actionFeedbackService: ActionFeedbackService,
    private publishResultService: PublishResultsService,
    private activityNavTreeService: ActivityNavTreeService,
    private breadcrumbsService: GetBreadcrumbsFromRootsService,
    private ltiDataSource: LTIDataSource,
  ) {}

  ngAfterViewChecked(): void {
    if (!this.iframe || this.taskService.initialized) return;
    this.taskService.initTask(this.iframe.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.taskConfig || changes.attemptId) this.taskService.configure(this.route, this.url, this.attemptId, this.taskConfig);
    if (changes.view) this.taskService.showView(this.view ?? 'task');
    if (
      changes.route &&
      !changes.route.firstChange &&
      (changes.route.previousValue as FullItemRoute | undefined)?.id !== (changes.route.currentValue as FullItemRoute | undefined)?.id
    ) {
      throw new Error('this component does not support changing its route input');
    }
    if (changes.url && !changes.url.firstChange) throw new Error('this component does not support changing its url input');
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
}
