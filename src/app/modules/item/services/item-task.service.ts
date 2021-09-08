import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, concat, EMPTY, forkJoin, interval, merge, Observable, of, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, switchMap, take, timeout } from 'rxjs/operators';
import { GenerateTaskTokenService } from 'src/app/core/http-services/generate-task-token.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { Item } from '../http-services/get-item-by-id.service';
import { TaskPlatform, Task, taskUrlWithParameters, taskProxyFromIframe } from '../task-communication/task-proxy';
import { TaskParamsValue, UpdateDisplayParams } from '../task-communication/types';

const answerAndStateSaveInterval = 1*SECONDS;

@Injectable()
export class ItemTaskService implements OnDestroy {
  private taskSubject = new ReplaySubject<Task>(1);
  task$ = this.taskSubject.asObservable();

  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  display$ = this.displaySubject.asObservable();

  private iframeSrcSubject = new ReplaySubject<SafeResourceUrl>(1);
  iframeSrc$ = this.iframeSrcSubject.asObservable();

  views$ = merge(
    this.task$.pipe(switchMap(task => task.getViews())), // Load views once the task has been loaded
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)), // listen to display updates
  ).pipe(map(views => Object.entries(views).filter(([ , view ]) => !view.requires).map(([ name ]) => name)));
  activeView$ = new BehaviorSubject<string>('task');
  showViews$ = combineLatest([ this.task$, this.activeView$ ]).pipe(switchMap(([ task, view ]) => task.showViewsInTask({ [view]: true })));

  initialized = false;

  private subscriptions = [
    this.task$.subscribe({
      error: () => {
        if (!this.displaySubject.closed) this.displaySubject.complete();
        if (!this.iframeSrcSubject.closed) this.iframeSrcSubject.complete();
      }
    }),
    this.saveAnswerAndState().subscribe({ error: err => this.taskSubject.error(err) }),
    this.showViews$.subscribe({ error: err => this.taskSubject.error(err) }),
  ];

  private platform = new TaskPlatform({
    validate: (mode): Observable<void> => this.validate(mode),
    getTaskParams: (): Observable<TaskParamsValue> =>
      of({ minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} }),
    updateDisplay: (display): Observable<void> => {
      this.displaySubject.next(display);
      return EMPTY;
    },
  });

  constructor(
    private sanitizer: DomSanitizer,
    private generateTaskTokenService: GenerateTaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task is a Replay Subject. If one has been emitted: destroy it, else: nothing to destroy
    this.task$.pipe(take(1), timeout(0)).subscribe(task => task.destroy());
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    if (!this.taskSubject.closed) this.taskSubject.complete();
    if (!this.displaySubject.closed) this.displaySubject.complete();
    if (!this.iframeSrcSubject.closed) this.iframeSrcSubject.complete();
  }

  getIframeConfig(item: Item, attemptId?: string): void {
    const url = item.url;
    if (!url) return this.taskSubject.error(new Error('No URL defined for this task'));
    if (!attemptId) return this.taskSubject.error(new Error('an attempt id is required to retrieve task token'));

    this.generateTaskTokenService.generateToken(item.id, attemptId).pipe(
      map(taskToken => {
        const urlWithParams = taskUrlWithParameters(url, taskToken, appConfig.itemPlatformId, 'task-');
        return this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
      }),
    ).subscribe({
      next: src => this.iframeSrcSubject.next(src),
      error: err => this.taskSubject.error(err),
    });
  }

  initTask(iframe: HTMLIFrameElement): void {
    if (this.initialized) return;
    this.initialized = true;

    taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        // Got task proxy from the iframe, ask task to load
        task.bindPlatform(this.platform);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      }),
    ).subscribe(this.taskSubject);
  }

  private validate(mode: string): Observable<void> {
    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }

    if (mode == 'validate') {
      return this.task$.pipe(
        // so that switchMap interrupts request if state changes
        switchMap(task => task.getAnswer().pipe(map(answer => ({ task, answer })))),
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

  // Automatically save the answer and state
  private saveAnswerAndState(): Observable<void> {
    return this.task$.pipe(
      switchMap(task => interval(answerAndStateSaveInterval).pipe(mapTo(task))),
      switchMap(task => forkJoin([ task.getAnswer(), task.getState() ])),
      distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
      /* TODO: save */
      mapTo(undefined),
    );
  }

  /* private */ reloadAnswerState(answer: string, state: string): void {
    this.task$.pipe(
      switchMap(task => concat(task.reloadState(state), task.reloadAnswer(answer))),
    ).subscribe({ error: err => this.taskSubject.error(err) });
  }
}
