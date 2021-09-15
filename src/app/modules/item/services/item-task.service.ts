import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, concat, EMPTY, forkJoin, interval, merge, Observable, of, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, shareReplay, switchMap, timeout } from 'rxjs/operators';
import { GenerateTaskTokenService } from 'src/app/core/http-services/generate-task-token.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { Item } from '../http-services/get-item-by-id.service';
import { TaskPlatform, taskUrlWithParameters, taskProxyFromIframe, Task } from '../task-communication/task-proxy';
import { TaskParamsValue, UpdateDisplayParams } from '../task-communication/types';

const answerAndStateSaveInterval = 1*SECONDS;

@Injectable()
export class ItemTaskService implements OnDestroy {
  private config$ = new ReplaySubject<{ itemId: string, url: string, attemptId: string }>(1);
  private iframe$ = new ReplaySubject<HTMLIFrameElement>(1);

  readonly iframeSrc$ = this.config$.pipe(
    switchMap(({ attemptId, itemId, url }) => this.generateTaskTokenService.generateToken(itemId, attemptId).pipe(
      map(taskToken => taskUrlWithParameters(url, taskToken, appConfig.itemPlatformId, 'task-')),
      map(urlWithParams => this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams)),
    )),
    shareReplay(1),
  );

  readonly task$ = this.iframe$.pipe(
    switchMap(iframe => taskProxyFromIframe(iframe)),
    switchMap(task => {
      this.bindPlatform(task);
      const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
      return task.load(initialViews).pipe(mapTo(task));
    }),
    shareReplay(1),
  );

  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  readonly display$ = this.displaySubject.asObservable();

  readonly views$ = merge(
    this.task$.pipe(switchMap(task => task.getViews())), // Load views once the task has been loaded
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)), // listen to display updates
  ).pipe(map(views => Object.entries(views).filter(([ , view ]) => !view.requires).map(([ name ]) => name)));
  readonly activeView$ = new BehaviorSubject<string>('task');
  readonly showViews$ = combineLatest([ this.task$, this.activeView$ ]).pipe(
    switchMap(([ task, view ]) => task.showViews({ [view]: true }))
  );

  initialized = false;

  private subscriptions = [
    this.saveAnswerAndState().subscribe({ error: err => this.setError(err) }),
    this.showViews$.subscribe({ error: err => this.setError(err) }),
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private generateTaskTokenService: GenerateTaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task replays last (and its only) value. If one has been emitted: destroy it, else: nothing to destroy
    this.task$.pipe(timeout(0)).subscribe(task => task.destroy());
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    if (!this.config$.closed) this.config$.complete();
    if (!this.iframe$.closed) this.iframe$.complete();
  }

  configure(item: Item, attemptId?: string): void {
    const url = item.url;
    if (!url) return this.setError(new Error('No URL defined for this task'));
    if (!attemptId) return this.setError(new Error('an attempt id is required to retrieve task token'));
    this.config$.next({ itemId: item.id, url, attemptId });
  }

  initTask(iframe: HTMLIFrameElement): void {
    if (this.initialized) return;
    this.initialized = true;
    this.iframe$.next(iframe);
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
    ).subscribe({ error: err => this.setError(err) });
  }

  private setError(error: unknown): void {
    if (!this.config$.closed) this.config$.error(error);
    if (!this.iframe$.closed) this.iframe$.error(error);
  }

  private bindPlatform(task: Task): void {
    const platform = new TaskPlatform({
      validate: (mode): Observable<void> => this.validate(mode),
      getTaskParams: (): Observable<TaskParamsValue> =>
        of({ minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} }),
      updateDisplay: (display): Observable<void> => {
        this.displaySubject.next(display);
        return EMPTY;
      },
      showView: (view): Observable<void> => {
        this.activeView$.next(view);
        return EMPTY;
      },
    });
    task.bindPlatform(platform);
  }
}
