import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { taskProxyFromIframe, taskUrlWithParameters, Task, } from 'src/app/modules/item/task-communication/task-proxy';
import { BehaviorSubject, concat, forkJoin, interval, merge, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, startWith, switchMap, take } from 'rxjs/operators';
import { UpdateDisplayParams } from '../../task-communication/types';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { readyData } from 'src/app/shared/operators/state';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { appConfig } from 'src/app/shared/helpers/config';
import { ItemTaskPlatform } from './task-platform';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { GenerateTaskTokenService } from '../../http-services/generate-task-token.service';

const initialHeight = 1200;
const heightSyncInterval = 0.2*SECONDS;
const answerAndStateSaveInterval = 1*SECONDS;

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ]
})
export class ItemDisplayComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = new BehaviorSubject<FetchState<Task>>(fetchingState());

  // Tabs displayed above the task
  // TODO get views from the task and make actual tabs
  activeTab: TaskTab = { name: 'Task' };
  tabs: TaskTab[] = [ this.activeTab ];

  iframeSrc?: SafeResourceUrl; // used by the iframe to load the task, set at view init

  private task$ = this.state$.pipe(readyData());
  private taskDisplay$ = new Subject<UpdateDisplayParams>();
  // Start updating the iframe height to match the task's height
  iframeHeight$ = merge(
    this.task$.pipe(switchMap(task => interval(heightSyncInterval).pipe(switchMap(() => task.getHeight())))),
    this.taskDisplay$.pipe(map(({ height }) => height), filter(isNotUndefined)),
  ).pipe(startWith(initialHeight), map(height => height + 40));

  // Automatically save the answer and state
  private saveAnswerAndState$ = this.state$.pipe(
    switchMap(state => interval(answerAndStateSaveInterval).pipe(mapTo(state))),
    readyData(),
    switchMap(task => forkJoin([ task.getAnswer(), task.getState() ])),
    distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
    /* TODO: save */
  );

  // Load views once the task has been loaded
  private taskViews$ = this.task$.pipe(switchMap(task => task.getViews().pipe(map(views => ({ task, views })))));
  private showViewsInTask$ = this.taskViews$.pipe(switchMap(({ task }) => task.showViewsInTask({ task: true })));

  private platform = new ItemTaskPlatform(this.task$, this.taskDisplay$);
  private loadTaskHasBeenInvoked = false;

  private subscriptions = [
    this.taskViews$.subscribe({
      next: ({ views }) => this.setTaskViews(views),
      error: err => this.state$.next(errorState(err)),
    }),
    this.showViewsInTask$.subscribe({ error: err => this.state$.next(errorState(err)) }),
    this.saveAnswerAndState$.subscribe(),
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private generateTaskTokenService: GenerateTaskTokenService,
  ) {}

  // Lifecycle functions
  ngOnInit(): void {
    if (!this.itemData) throw new Error('itemData must be set in ItemDisplayComponent');

    const rawUrl = this.itemData.item.url;
    if (!rawUrl) return this.state$.next(errorState(new Error($localize`No URL defined for this task.`)));

    const attemptId = this.itemData.route.attemptId || this.itemData.currentResult?.attemptId;
    if (!attemptId) return this.state$.next(errorState(new Error($localize`No attempt found for this task.`)));

    this.generateTaskTokenService.generateToken(this.itemData.item.id, attemptId).subscribe({
      next: taskToken => {
        const urlWithParams = taskUrlWithParameters(rawUrl, taskToken, appConfig.itemPlatformId, 'task-');
        this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
      },
      error: () => this.state$.next(errorState(new Error($localize`Could not create a token for this task`)))
    });
  }

  ngAfterViewChecked(): void {
    // Because we call a task token, the iframe won't be available at init.
    // When it is available, load ONCE the task from the iframe.
    if (!this.iframe || this.loadTaskHasBeenInvoked) return;
    this.loadTaskFromIframe(this.iframe.nativeElement);
    this.loadTaskHasBeenInvoked = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData && !changes.itemData.firstChange) throw new Error('This component does not support change of its itemData input');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());

    // destroy the task
    const state = this.state$.value;
    if (state.isReady) state.data.destroy();
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }

  reloadAnswerState(answer: string, state: string): void {
    this.state$.pipe(
      take(1),
      readyData(),
      switchMap(task => concat(task.reloadState(state), task.reloadAnswer(answer))),
    ).subscribe();
  }

  /** Initializes a task once the URL has been loaded in the iframe */
  private loadTaskFromIframe(iframe: HTMLIFrameElement): void {
    taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        // Got task proxy from the iframe, ask task to load
        task.bindPlatform(this.platform);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      })
    ).subscribe({
      next: task => this.state$.next(readyState(task)),
      error: err => this.state$.next(errorState(err))
    });
  }

  private setTaskViews(_views: any): void {
    // TODO
  }
}
