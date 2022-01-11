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
import { fromEvent, interval, merge, Observable, ReplaySubject } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, pairwise, startWith, switchMap } from 'rxjs/operators';
import { HOURS, SECONDS } from 'src/app/shared/helpers/duration';
import { isNotNull, isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { TaskConfig, ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { capitalize } from 'src/app/shared/helpers/case_conversion';
import { ItemTaskInitService } from '../../services/item-task-init.service';
import { ItemTaskAnswerService } from '../../services/item-task-answer.service';
import { ItemTaskViewsService } from '../../services/item-task-views.service';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { DomSanitizer } from '@angular/platform-browser';
import { PermissionsInfo } from '../../helpers/item-permissions';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { LayoutService } from 'src/app/shared/services/layout.service';

const initialHeight = 0;
const appMainSectionPaddingBottom = '6rem';
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
  @Input() taskConfig: TaskConfig = { readOnly: false, formerAnswer: null };
  @Input() savingAnswer = false;

  @Output() scoreChange = this.taskService.scoreChange$;
  @Output() skipSave = new EventEmitter<void>();

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = this.taskService.task$.pipe(mapToFetchState());
  initError$ = this.taskService.initError$;
  urlError$ = this.taskService.urlError$;
  unknownError$ = this.taskService.unknownError$;
  iframeSrc$ = this.taskService.iframeSrc$.pipe(map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)));

  @Output() viewChange = this.taskService.activeView$;
  @Output() tabsChange: Observable<TaskTab[]> = this.taskService.views$.pipe(
    map(views => views.map(view => ({ view, name: this.getTabNameByView(view) }))),
  );


  private computeIframeOffsetTop$ = new ReplaySubject<void>(1);
  private iframeOffsetTop$ = merge(
    fromEvent(globalThis, 'resize'),
    this.layoutService.fullFrameContent$.pipe(delay(1000)), // time for the animation be complete
    this.computeIframeOffsetTop$,
  ).pipe(
    map(() => (this.iframe ? this.iframe.nativeElement.getBoundingClientRect().top + globalThis.scrollY : null)),
    filter(isNotNull),
    distinctUntilChanged(),
  );
  // Start updating the iframe height to match the task's height
  iframeHeight$ = this.taskService.task$.pipe(
    switchMap(task => task.getMetaData()),
    switchMap(({ autoHeight }) => {
      if (autoHeight) return this.iframeOffsetTop$.pipe(map(top => `calc(100vh - ${top}px - ${appMainSectionPaddingBottom})`));
      return merge(
        this.taskService.task$.pipe(switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight())))),
        this.taskService.display$.pipe(map(({ height }) => height), filter(isNotUndefined)),
      ).pipe(startWith(initialHeight), map(height => `${height}px`));
    }),
    distinctUntilChanged(),
  );

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
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.taskService.configure(this.route, this.url, this.attemptId, this.taskConfig);
    this.taskService.showView(this.view ?? 'task');
  }

  ngAfterViewChecked(): void {
    if (!this.iframe || this.taskService.initialized) return;
    this.computeIframeOffsetTop$.next();
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
    this.computeIframeOffsetTop$.complete();
    this.subscription.unsubscribe();
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
    this.subscription.unsubscribe();
    return this.taskService.saveAnswerAndState();
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
