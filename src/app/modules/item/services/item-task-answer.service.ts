import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, fromEvent, interval, merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  combineLatestWith,
  defaultIfEmpty,
  delayWhen,
  distinctUntilChanged,
  filter,
  last,
  map,
  mapTo,
  shareReplay,
  skipUntil,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { isNotNullOrUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { AnswerTokenService } from '../http-services/answer-token.service';
import { CurrentAnswerService } from '../http-services/current-answer.service';
import { GradeService } from '../http-services/grade.service';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.asObservable();

  // All observables below have only one emitted (and replayed) value
  private task$ = this.taskInitService.task$.pipe(takeUntil(this.error$), last());
  private config$ = this.taskInitService.config$.pipe(takeUntil(this.error$), last());
  private taskToken$ = this.taskInitService.taskToken$.pipe(takeUntil(this.error$), last());

  private initialCurrentAnswer$ = this.config$.pipe(
    switchMap(({ route, attemptId }) => this.currentAnswerService.get(route.id, attemptId)),
    catchError(error => {
      // currently, the backend returns a 403 status when no current answer exist for user+item+attempt
      if (errorIsHTTPForbidden(error)) return of(undefined);
      throw error;
    }),
    shareReplay(1), // avoid duplicate xhr calls
  );

  private initializedTaskState$: Observable<void> = this.initialCurrentAnswer$.pipe(
    map(currentAnswer => currentAnswer?.state),
    filter(isNotNullOrUndefined),
    combineLatestWith(this.task$), // task emits once
    switchMap(([ state, task ]) => task.reloadState(state).pipe(mapTo(undefined))),
    defaultIfEmpty(undefined),
  );
  private initializedTaskAnswer$: Observable<void> = this.initialCurrentAnswer$.pipe(
    delayWhen(() => this.initializedTaskState$),
    map(currentAnswer => currentAnswer?.answer),
    filter(isNotNullOrUndefined),
    combineLatestWith(this.task$), // task emits once
    switchMap(([ answer, task ]) => task.reloadAnswer(answer).pipe(mapTo(undefined))),
    defaultIfEmpty(undefined),
  );

  private lastSavedTaskState?: string;
  private lastSavedTaskAnswer?: string;
  private taskState?: string;
  private taskAnswer?: string;

  private subscriptions = [
    this.initializedTaskState$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.initializedTaskAnswer$.subscribe({ error: err => this.errorSubject.next(err) }),
    merge(
      fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'hidden')),
      fromEvent(globalThis, 'pagehide'),
      fromEvent(globalThis, 'online'),
    ).pipe(switchMap(() => this.saveCurrentAnswer())).subscribe(),

    this.task$
      .pipe(delayWhen(() => this.initializedTaskState$), switchMap(task => task.getState()), take(1))
      .subscribe(state => this.lastSavedTaskState = state),
    this.task$
      .pipe(delayWhen(() => this.initializedTaskAnswer$), switchMap(task => task.getAnswer()), take(1))
      .subscribe(answer => this.lastSavedTaskAnswer = answer),

    this.task$.pipe(
      repeatLatestWhen(interval(1*SECONDS)),
      skipUntil(this.initializedTaskState$),
      switchMap(task => task.getState()),
      distinctUntilChanged(),
    ).subscribe(state => this.taskState = state),
    this.task$.pipe(
      repeatLatestWhen(interval(1*SECONDS)),
      skipUntil(this.initializedTaskAnswer$),
      switchMap(task => task.getAnswer()),
      distinctUntilChanged(),
    ).subscribe(answer => this.taskAnswer = answer),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private currentAnswerService: CurrentAnswerService,
    private answerTokenService: AnswerTokenService,
    private gradeService: GradeService,
  ) {}

  ngOnDestroy(): void {
    this.saveCurrentAnswer().subscribe();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.errorSubject.complete();
  }

  submitAnswer(): Observable<unknown> {
    // Step 1: get answer from task
    const answer$ = this.task$.pipe(take(1), switchMap(task => task.getAnswer()), shareReplay(1));

    // Step 2: generate answer token with backend
    const answerToken$ = combineLatest([ this.taskToken$, answer$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answer ]) => this.answerTokenService.generate(answer, taskToken)),
      shareReplay(1),
    );

    // Step 3: get answer grade with answer token from task
    const grade$ = combineLatest([ this.task$, answer$, answerToken$ ]).pipe(
      take(1),
      switchMap(([ task, answer, answerToken ]) => task.gradeAnswer(answer, answerToken)),
      shareReplay(1),
    );

    // Step 4: Save grade in backend
    return combineLatest([ this.taskToken$, answerToken$, grade$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answerToken, grade ]) => this.gradeService.save(
        taskToken,
        answerToken,
        grade.score,
        grade.scoreToken ?? undefined,
      )),
    );
  }

  reloadAnswer(): Observable<unknown> {
    return this.task$.pipe(take(1), switchMap(task => task.reloadAnswer('')));
  }

  private saveCurrentAnswer(): Observable<void> {
    const shouldSaveTaskAnswer = !!this.taskAnswer && this.taskAnswer !== this.lastSavedTaskAnswer;
    const shouldSaveTaskState = !!this.taskState && this.taskState !== this.lastSavedTaskState;
    if (!shouldSaveTaskAnswer && !shouldSaveTaskState) return EMPTY;

    this.lastSavedTaskState = this.taskState;
    this.lastSavedTaskAnswer = this.taskAnswer;

    const body = { answer: this.taskAnswer ?? '', state: this.taskState ?? '' };
    return this.config$.pipe(switchMap(({ route, attemptId }) => this.currentAnswerService.update(route.id, attemptId, body)));
  }
}
