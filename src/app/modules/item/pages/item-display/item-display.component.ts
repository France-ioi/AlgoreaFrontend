import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { EMPTY, interval, Observable, merge, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, ignoreElements, map, pairwise, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { HOURS, SECONDS } from 'src/app/shared/helpers/duration';
import { TaskConfig, ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { capitalize } from 'src/app/shared/helpers/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { DomSanitizer } from '@angular/platform-browser';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { LTIDataSource } from 'src/app/modules/lti/services/lti-datasource.service';
import { PublishResultsService } from '../../http-services/publish-result.service';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { ItemPermWithEdit, ItemEditPerm } from 'src/app/shared/models/domain/item-edit-permission';

export interface TaskTab {
  name: string,
  view: string,
}

const heightSyncInterval = 0.2*SECONDS;

@Component({
  selector: 'alg-item-display[url][attemptId][route]',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ],
  providers: [ ItemTaskService, ItemTaskInitService, ItemTaskAnswerService, ItemTaskViewsService ],
})
export class ItemDisplayComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {
  @Input() route!: FullItemRoute;
  @Input() url!: string;
  @Input() editingPermission: ItemPermWithEdit = { canEdit: ItemEditPerm.None };
  @Input() attemptId!: string;
  @Input() view?: TaskTab['view'];
  @Input() taskConfig: TaskConfig = { readOnly: false, initialAnswer: null };
  @Input() savingAnswer = false;

  @Output() scoreChange = this.taskService.scoreChange$;
  @Output() skipSave = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = merge(this.taskService.task$, this.taskService.error$).pipe(mapToFetchState());
  initError$ = this.taskService.initError$;
  urlError$ = this.taskService.urlError$;
  unknownError$ = this.taskService.unknownError$;
  iframeSrc$ = this.taskService.iframeSrc$.pipe(
    map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)),
    catchError(() => EMPTY),
  );

  private metadata = this.taskService.task$.pipe(switchMap(task => task.getMetaData()), shareReplay(1));
  metadataError$ = this.metadata.pipe(ignoreElements(), catchError(err => of(err)));
  metadata$ = this.metadata.pipe(catchError(() => EMPTY)); /* never emit errors */

  @Output() editorUrl = this.metadata$.pipe(map(({ editorUrl }) => editorUrl));

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

  showTaskAnyway = false;

  @Output() viewChange = this.taskService.activeView$;
  @Output() tabsChange: Observable<TaskTab[]> = this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  );

  private subscriptions = [
    this.taskService.saveAnswerAndStateInterval$
      .pipe(startWith({ success: true }), pairwise())
      .subscribe(([ previous, next ]) => {
        const shouldDisplayError = !next.success && !this.actionFeedbackService.hasFeedback;
        const shouldDisplaySuccess = !previous.success && next.success;
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
  ];

  errorMessage = $localize`:@@unknownError:An unknown error occurred. ` +
    $localize`:@@contactUs:If the problem persists, please contact us.`;

  constructor(
    private taskService: ItemTaskService,
    private sanitizer: DomSanitizer,
    private actionFeedbackService: ActionFeedbackService,
    private publishResultService: PublishResultsService,
    private ltiDataSource: LTIDataSource,
  ) {}

  ngOnInit(): void {
    this.taskService.configure(this.route, this.url, this.attemptId, this.taskConfig);
    this.taskService.showView(this.view ?? 'task');
  }

  ngAfterViewChecked(): void {
    if (!this.iframe || this.taskService.initialized) return;
    this.taskService.initTask(this.iframe.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view && this.view) this.taskService.showView(this.view);
    if (
      changes.route &&
      !changes.route.firstChange &&
      (changes.route.previousValue as FullItemRoute | undefined)?.id !== (changes.route.currentValue as FullItemRoute | undefined)?.id
    ) {
      throw new Error('this component does not support changing its route input');
    }
    if (changes.url && !changes.url.firstChange) throw new Error('this component does not support changing its url input');
    if (changes.attemptId && !changes.attemptId.firstChange) {
      throw new Error('this component does not support changing its attemptId input');
    }
  }

  ngOnDestroy(): void {
    if (this.actionFeedbackService.hasFeedback) this.actionFeedbackService.clear();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
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
