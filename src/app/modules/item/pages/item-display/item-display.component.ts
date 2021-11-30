import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { EMPTY, interval, merge, Observable, Subject } from 'rxjs';
import { endWith, filter, map, pairwise, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { HOURS, SECONDS } from 'src/app/shared/helpers/duration';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ConfigureTaskOptions, ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { capitalize } from 'src/app/shared/helpers/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { FullItemRoute, urlArrayForItemRoute } from 'src/app/shared/routing/item-route';
import { DomSanitizer } from '@angular/platform-browser';
import { PermissionsInfo } from '../../helpers/item-permissions';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

const initialHeight = 0;
const additionalHeightToPreventInnerScrollIssues = 40;
const heightSyncInterval = 0.2*SECONDS;

export interface TaskTab {
  name: string,
  view: string,
}

@Component({
  selector: 'alg-item-display[url][attemptId][route]',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ],
  providers: [ ItemTaskService, ItemTaskInitService, ItemTaskAnswerService, ItemTaskViewsService ],
})
export class ItemDisplayComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {
  @Input() route!: FullItemRoute;
  @Input() url!: string;
  @Input() canEdit: PermissionsInfo['canEdit'] = 'none';
  @Input() attemptId!: string;
  @Input() view?: TaskTab['view'];
  @Input() taskOptions: ConfigureTaskOptions = { readOnly: false, shouldLoadAnswer: true };

  @Output() scoreChange = this.taskService.scoreChange$;

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = this.taskService.task$.pipe(mapToFetchState());
  initError$ = this.taskService.initError$;
  urlError$ = this.taskService.urlError$;
  answerFallbackLink$ = this.taskService.loadAnswerByIdError$.pipe(
    map(() => urlArrayForItemRoute({ ...this.route, attemptId: undefined, parentAttemptId: undefined, answerId: undefined })),
  );
  unknownError$ = this.taskService.unknownError$;
  iframeSrc$ = this.taskService.iframeSrc$.pipe(map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)));

  @Output() viewChange = this.taskService.activeView$;
  @Output() tabsChange: Observable<TaskTab[]> = this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  );


  // Start updating the iframe height to match the task's height
  iframeHeight$ = merge(
    this.taskService.task$.pipe(switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight())))),
    this.taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
  ).pipe(map(height => height + additionalHeightToPreventInnerScrollIssues), startWith(initialHeight));

  savingAnswerAndState = false;

  private skipSave$ = new Subject<void>();
  private subscription = this.taskService.saveAnswerAndStateInterval$
    .pipe(startWith({ success: true }), pairwise())
    .subscribe(([ previous, next ]) => {
      const shouldDisplayError = !next.success && !this.actionFeedbackService.hasFeedback;
      const shouldDisplaySuccess = !previous.success && next.success;
      if (shouldDisplayError) {
        const message = $localize`Your current progress could not have been saved. Are you connected to the internet ?`;
        this.actionFeedbackService.error(message, { life: 24*HOURS });
      }
      if (shouldDisplaySuccess) {
        this.actionFeedbackService.clear();
        this.actionFeedbackService.success($localize`Progress saved!`);
      }
    });

  constructor(
    private taskService: ItemTaskService,
    private sanitizer: DomSanitizer,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  ngOnInit(): void {
    this.taskService.configure(this.route, this.url, this.attemptId, this.taskOptions);
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
    this.subscription.unsubscribe();
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
    this.subscription.unsubscribe();
    if (this.taskOptions.readOnly) return EMPTY;

    const save$ = this.taskService.saveAnswerAndState().pipe(
      takeUntil(this.skipSave$),
      endWith({ saving: false }),
      shareReplay(1),
    );
    save$.subscribe(({ saving }) => this.savingAnswerAndState = saving);
    return save$;
  }

  skipSave(): void {
    this.skipSave$.next();
  }

  private getTabNameByView(view: string): string {
    switch (view) {
      case 'editor': return $localize`Editor`;
      case 'forum': return $localize`Forum`;
      case 'hints': return $localize`Hints`;
      case 'solution': return $localize`Solution`;
      case 'submission': return $localize`Submission`;
      case 'task': return $localize`Task`;
      default: return capitalize(view);
    }
  }
}
