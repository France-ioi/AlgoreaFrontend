import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItemData } from '../../services/item-datasource.service';
import { taskProxyFromIframe, taskUrlWithParameters, TaskListener, Task, } from 'src/app/modules/item/task-communication/task-proxy';
import { EMPTY, forkJoin, interval, Observable, of, OperatorFunction, Subscription, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TaskParamsKeyDefault, TaskParamsValue, TaskViews } from '../../task-communication/types';

interface TaskTab {
  name: string
}

@Component({
  selector: 'alg-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: [ './item-display.component.scss' ]
})
export class ItemDisplayComponent extends TaskListener implements OnInit, AfterViewInit, OnDestroy {
  @Input() itemData?: ItemData;
  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  // Iframe state
  state: 'loading' | 'loaded' | 'unloading' | 'error' = 'loading';
  url?: SafeResourceUrl;
  msg = '';

  // Tabs displayed above the task
  // TODO get views from the task and make actual tabs
  activeTab: TaskTab = { name: 'Task' };
  tabs: TaskTab[] = [ this.activeTab ];

  // Task
  task?: Task;

  // Iframe height
  height = 400;
  heightInterval?: Subscription;

  // Answer/state data from the task
  lastAnswer = '';
  lastState = '';
  saveInterval?: Subscription;

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  // Lifecycle functions
  ngOnInit(): void {
    const url = this.itemData?.item.url || '';

    if (!url) {
      this.state = 'error';
      // TODO better behavior when there is no URL defined for the task?
      this.msg = $localize`No URL defined for this task.`;
      return;
    }
    // TODO get sToken
    const taskToken = '';
    // TODO get platformId from configuration
    const platformId = 'http://algorea.pem.dev';
    this.setIframeUrl(taskUrlWithParameters(url, taskToken, platformId, 'task-'));
  }

  ngAfterViewInit(): void {
    // Wait for the ViewChild to be initialized
    if (this.iframe) {
      const iframe = this.iframe.nativeElement;
      this.loadTaskFromIframe(iframe);
    }
  }

  ngOnDestroy(): void {
    this.heightInterval?.unsubscribe();
    this.saveInterval?.unsubscribe();
    this.task?.destroy();
  }

  /**
   * Returns the task if loaded, an error otherwise
   * Helpful to cancel Observable chains as soon as the task is unloaded
   */
  getTaskOperator(): OperatorFunction<unknown, Task> {
    return switchMap(() => {
      if (!this.task) {
        return throwError(() => new Error('No task loaded.'));
      }
      return of(this.task);
    });
  }

  /** Initializes a task once the URL has been loaded in the iframe */
  loadTaskFromIframe(iframe: HTMLIFrameElement): void {
    taskProxyFromIframe(iframe)
      .pipe(
        switchMap((task: Task) => {
          // Got task proxy from the iframe, ask task to load
          this.task = task;
          this.task.bindPlatform(this);

          const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
          return task.load(initialViews);
        }),
        this.getTaskOperator(),
        switchMap(task => {
          // Task loaded
          this.state = 'loaded';

          // Start intervals
          this.startHeightInterval();
          this.startSaveInterval();

          // Get the task views
          return task.getViews();
        }),
        switchMap((views: TaskViews) => {
          // Set the views the task should display
          // TODO Actual logic for tasks with more views than just task
          this.setTaskViews(views);
          return this.task?.showViewsInTask({ task: true }) || EMPTY;
        })
      )
      .subscribe();
  }

  // Communication with the task
  startHeightInterval(): void {
    // Start updating the iframe height to match the task's height
    this.heightInterval = interval(1000)
      .pipe(
        this.getTaskOperator(),
        switchMap(task => task.getHeight())
      )
      .subscribe(height => this.setIframeHeight(height));
  }

  startSaveInterval(): void {
    // Automatically save the answer and state
    this.saveInterval = interval(1000)
      .pipe(
        this.getTaskOperator(),
        switchMap(task => forkJoin([
          task.getAnswer(),
          task.getState()
        ]))
      )
      .subscribe(([ answer, state ]) => this.saveAnswerState(answer, state));
  }

  reloadAnswerState(answer: string, state: string): void {
    if (!this.task) {
      return;
    }
    const task = this.task;
    task.reloadState(state)
      .pipe(switchMap(() =>
        task.reloadAnswer(answer)
      ))
      .subscribe();
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

  setIframeUrl(url?: string | null): void {
    this.url = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : undefined;
  }

  setActiveTab(tab: TaskTab): void {
    this.activeTab = tab;
  }

  // *** TaskListener Implementation ***
  validate(mode: string): Observable<void> {
    if (!this.task) {
      return EMPTY;
    }

    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }

    if (mode == 'validate') {
      return this.task.getAnswer()
        .pipe(
          switchMap(answer => this.task?.gradeAnswer(answer, '') || throwError(() => new Error('Task disappeared.'))),
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
