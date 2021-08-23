import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { taskProxyFromIframe, taskUrlWithParameters, TaskListener, Task, } from 'src/app/modules/item/task-communication/task-proxy';
import { BehaviorSubject, concat, EMPTY, forkJoin, interval, Observable, of, Subscription } from 'rxjs';
import { map, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { TaskParamsKeyDefault, TaskParamsValue } from '../../task-communication/types';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { readyData } from 'src/app/shared/operators/state';

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ]
})
export class ItemDisplayComponent extends TaskListener implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  state$ = new BehaviorSubject<FetchState<Task>>(fetchingState());

  // Tabs displayed above the task
  // TODO get views from the task and make actual tabs
  activeTab: TaskTab = { name: 'Task' };
  tabs: TaskTab[] = [ this.activeTab ];

  // display of the iframe
  url?: SafeResourceUrl; // used by the iframe to load the task, set at view init
  height = 400;

  // Answer/state data from the task
  private lastAnswer = '';
  private lastState = '';

  private subscriptions = [ this.registerTaskViewLoading(), this.registerRecurringHeightSync(), this.registerRecurringSave() ];

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  // Lifecycle functions
  ngOnInit(): void {
    if (!this.itemData) throw new Error('itemData must be set in ItemDisplayComponent');

    const rawUrl = this.itemData.item.url;

    if (!rawUrl) {
      // TODO better behavior when there is no URL defined for the task?
      this.state$.next(errorState(new Error($localize`No URL defined for this task.`)));
      return;
    }
    // TODO get sToken
    const taskToken = '';
    // TODO get platformId from configuration
    const platformId = 'http://algorea.pem.dev';
    const urlWithParams = taskUrlWithParameters(rawUrl, taskToken, platformId, 'task-');
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
  }

  ngAfterViewInit(): void {
    // ngAfterViewInit waits for the ViewChild to be initialized
    if (!this.iframe) throw new Error('Expecting the iframe to exist');
    const iframe = this.iframe.nativeElement;
    this.loadTaskFromIframe(iframe);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData) throw new Error('This component does not support change of its itemData input');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());

    // destroy the task
    const state = this.state$.value;
    if (state.isReady) state.data.destroy();
  }

  /** Initializes a task once the URL has been loaded in the iframe */
  loadTaskFromIframe(iframe: HTMLIFrameElement): void {
    taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        // Got task proxy from the iframe, ask task to load
        task.bindPlatform(this);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      })
    ).subscribe({
      next: task => this.state$.next(readyState(task)),
      error: err => this.state$.next(errorState(err))
    });
  }

  /* Communication with the task */

  registerTaskViewLoading(): Subscription {
    // Load views once the task has been loaded
    return this.state$.pipe(
      readyData(),
      switchMap(task => task.getViews().pipe(map(views => ({ task, views })))),
      tap(({ task: _, views }) => this.setTaskViews(views)),
      switchMap(({ task, views: _ }) => task.showViewsInTask({ task: true })),
    ).subscribe({
      error: err => this.state$.next(errorState(err))
    });
  }

  registerRecurringHeightSync(): Subscription {
    // Start updating the iframe height to match the task's height
    return this.state$.pipe(
      switchMap(s => interval(1000).pipe(mapTo(s))),
      readyData(),
      switchMap(task => task.getHeight()),
    ).subscribe(height => this.setIframeHeight(height));
  }

  registerRecurringSave(): Subscription {
    // Automatically save the answer and state
    return this.state$.pipe(
      switchMap(s => interval(1000).pipe(mapTo(s))),
      readyData(),
      switchMap(task => forkJoin([
        task.getAnswer(),
        task.getState()
      ]))
    ).subscribe(([ answer, state ]) => this.saveAnswerState(answer, state));
  }

  reloadAnswerState(answer: string, state: string): void {
    this.state$.pipe(
      take(1),
      readyData(),
      switchMap(task => concat(task.reloadState(state), task.reloadAnswer(answer))),
    ).subscribe();
  }

  saveAnswerState(answer: string, state: string): void {
    if (answer != this.lastAnswer || state != this.lastState) {
      // TODO Save
    }
    this.lastAnswer = answer;
    this.lastState = state;
  }

  // Views management
  setTaskViews(_views: any): void {
    // TODO
  }

  // Utility functions
  setIframeHeight(height?: number): void {
    if (height !== undefined) {
      this.height = height;
    }
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }

  // *** TaskListener Implementation ***
  validate(mode: string): Observable<void> {
    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }

    if (mode == 'validate') {
      return this.state$.pipe( // so that switchMap interrupts request if state changes
        switchMap(state => (state.isReady ? state.data.getAnswer().pipe(map(answer => ({ task: state.data, answer }))) : EMPTY)),
        switchMap(({ task, answer }) => task.gradeAnswer(answer, '')),
        switchMap((_results: any) =>
          // TODO Do something with the results
          EMPTY
        )
      );
    }
    // Other unimplemented modes
    return EMPTY;
  }

  getTaskParams(_keyDefault?: TaskParamsKeyDefault): Observable<TaskParamsValue> {
    const taskParams = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    return of(taskParams);
  }
}
