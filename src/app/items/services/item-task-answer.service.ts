import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, forkJoin, interval, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  delayWhen,
  filter,
  map,
  retry,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
  timeout,
} from 'rxjs/operators';
import { SECONDS } from 'src/app/utils/duration';
import { AnswerTokenService } from '../data-access/answer-token.service';
import { AnswerService } from '../data-access/answer.service';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GradeService } from '../data-access/grade.service';
import { ItemTaskConfig, ItemTaskInitService } from './item-task-init.service';
import { Answer } from './item-task.service';
import { areStateAnswerEqual } from '../models/answers';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';

const answerAndStateSaveInterval = 60*SECONDS;

/** config of a task which has been started, so which has an attempt id set */
type RunningItemTaskConfig = ItemTaskConfig & { attemptId: string };

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private destroyed$ = new Subject<void>();

  private errorSubject = new Subject<unknown>();
  readonly error$ = this.errorSubject.asObservable();

  private scoreChange = new Subject<number>();
  readonly scoreChange$ = this.scoreChange.asObservable();

  private loadedTask$ = this.taskInitService.loadedTask$.pipe(
    catchError(() => EMPTY), // error handled in subscriptions
    takeUntil(this.error$)
  );

  private config$ = this.taskInitService.config$.pipe(
    takeUntil(this.error$),
    filter((config): config is RunningItemTaskConfig => config.attemptId !== undefined)
  );
  private taskToken$ = this.taskInitService.taskToken$.pipe(takeUntil(this.error$));

  private latestSavedCurrentAnswer: { state: string, answer: string } | null = null;

  private initialAnswer$: Observable<Answer | null> = this.config$.pipe(
    switchMap(({ route, attemptId, initialAnswer }) => {
      if (initialAnswer === undefined) return EMPTY;
      if (route.answer?.loadAsCurrent && initialAnswer) {
        return this.loadAsNewCurrentAnswer(route.id, attemptId, initialAnswer);
      }
      return of(initialAnswer);
    }),
    retry(3),
    takeUntil(this.destroyed$),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );

  private initializedTaskState$ = combineLatest([
    this.initialAnswer$.pipe(catchError(() => EMPTY)), // error is handled elsewhere
    this.loadedTask$,
    this.config$.pipe(take(1)),
  ]).pipe(
    switchMap(([ initialAnswer, task, { readOnly }]) =>
      (initialAnswer?.state && !readOnly ? task.reloadState(initialAnswer.state).pipe(map(() => undefined)) : of(undefined))
    ),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );
  private initializedTaskAnswer$ = combineLatest([
    this.initialAnswer$.pipe(catchError(() => EMPTY)), // error is handled elsewhere
    this.loadedTask$,
  ]).pipe(
    delayWhen(() => this.initializedTaskState$),
    switchMap(([ initialAnswer, task ]) => (initialAnswer?.answer ?
      task.reloadAnswer(initialAnswer.answer).pipe(
        map(() => undefined),
        // if the task reports an error while loading the answer, consider it ready anyway (task will show the appropriate error message)
        catchError(() => of(undefined)),
      ) :
      of(undefined)
    )),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  /**
   * Wait for the task state & answer to have been initialized to allow auto-saves
   */
  private canStartSaveInterval$: Observable<void> = this.config$.pipe(
    take(1),
    filter(({ readOnly }) => !readOnly),
    map(() => undefined),
    delayWhen(() => combineLatest([ this.initializedTaskState$, this.initializedTaskAnswer$ ])),
  );

  private autoSaveCurrentState$ = this.canStartSaveInterval$.pipe( // wait for the task answer+state to have been initialized
    switchMap(() => interval(answerAndStateSaveInterval)),
    switchMap(() => this.saveTaskStateAnswerAsCurrent()),
    takeUntil(this.destroyed$), // make sure the repetition ends when the service gets destroyed
    shareReplay(1), // do not save several times in parallel if there are more subscribers
  );
  autoSaveResult$ = this.autoSaveCurrentState$.pipe(
    switchMap(state => {
      if (state.isError) return of(false);
      if (state.isReady) return of(true);
      return EMPTY; // if the save is "waiting"
    })
  );

  private subscriptions = [
    this.initializedTaskAnswer$.subscribe(),
    this.initializedTaskState$.subscribe({
      error: err => this.errorSubject.next(err),
    }),
    this.taskInitService.loadedTask$.subscribe({
      error: err => this.errorSubject.next(err),
    }),
    this.initialAnswer$.subscribe({
      next: answer => this.latestSavedCurrentAnswer = answer ? { answer: answer.answer ?? '', state: answer.state ?? '' } : null,
      error: err => this.errorSubject.next(err),
    }),
    this.autoSaveCurrentState$.subscribe(),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private currentAnswerService: CurrentAnswerService,
    private answerService: AnswerService,
    private answerTokenService: AnswerTokenService,
    private gradeService: GradeService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.errorSubject.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  submitAnswer(): Observable<unknown> {
    // Step 1: get answer from task
    const answer$ = this.loadedTask$.pipe(take(1), switchMap(task => task.getAnswer()), takeUntil(this.destroyed$), shareReplay(1));

    // Step 2: generate answer token with backend
    const answerToken$ = combineLatest([ this.taskToken$, answer$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answer ]) => this.answerTokenService.generate(answer, taskToken)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );

    // Step 3: get answer grade with answer token from task
    const grade$ = combineLatest([ this.loadedTask$, answer$, answerToken$ ]).pipe(
      take(1),
      switchMap(([ task, answer, answerToken ]) => task.gradeAnswer(answer, answerToken)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );

    // Step 4: Save grade in backend
    const saveGrade$ = combineLatest([ this.taskToken$, answerToken$, grade$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answerToken, grade ]) => this.gradeService.save(
        taskToken,
        answerToken,
        grade.score,
        grade.scoreToken ?? undefined,
      )),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
    combineLatest([ grade$, saveGrade$, this.saveTaskStateAnswerAsCurrent() ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere by returning saveGrade$
      .subscribe(([ grade ]) => {
        if (grade.score !== undefined) this.scoreChange.next(grade.score);
      });
    return saveGrade$;
  }

  clearAnswer(): Observable<unknown> {
    return this.loadedTask$.pipe(take(1), switchMap(task => task.reloadAnswer('')));
  }

  /**
   * Ask the task for its current state and answer, and save it as current.
   */
  saveTaskStateAnswerAsCurrent(): Observable<FetchState<void>> {
    return this.taskStateAnswer().pipe(
      switchMap(answer => this.saveAsCurrentAnswer(answer)),
      defaultIfEmpty(undefined), // emit a ready state if taskStateAnswer or saveAsCurrentAnswer are empty
      mapToFetchState(),
      shareReplay(1),
    );
  }

  /**
   * Observable that emits the current state and answer received from the task
   * Completes without emitting if there is no loaded task
   * Errors if there is no loaded task or if the task fails in responding to answer or state request
   */
  private taskStateAnswer(): Observable<{ state: string, answer: string }> {
    return this.loadedTask$.pipe(
      take(1),
      timeout(1), // loaded task must be available immediately
      catchError(() => EMPTY), // no task is not considered as an error but a normal case doing nothing
      switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() })),
    );
  }

  /**
   * Save the given state-answer as current.
   * Emit when the save is done
   * Complete without emitting if the save has been skipped (because no config, read-only answer or state unchanged)
   * Errors if the config was not set or if the save failed
   */
  private saveAsCurrentAnswer(answer: { state: string, answer: string }): Observable<void> {
    return this.config$.pipe(
      take(1),
      timeout(1), // skip the saving if there are no config immediately
      catchError(() => EMPTY), // no config is not considered as an error but a normal case doing nothing
      switchMap(({ route, attemptId, readOnly }) => {
        // skip save if readonly
        if (readOnly) return EMPTY;
        // skip save if no change since latest successful save
        if (this.latestSavedCurrentAnswer && areStateAnswerEqual(this.latestSavedCurrentAnswer, answer)) return EMPTY;
        return this.currentAnswerService.update(route.id, attemptId, answer).pipe(
          tap(() => this.latestSavedCurrentAnswer = answer),
          map(() => undefined),
        );
      }),
    );
  }

  private loadAsNewCurrentAnswer(itemId: string, attemptId: string, newAnswer: Answer): Observable<Answer> {
    return this.currentAnswerService.get(itemId, attemptId).pipe(
      switchMap(currentAnswer => {
        if (currentAnswer) {
          return areStateAnswerEqual(currentAnswer, newAnswer) ?
            EMPTY : // do not do anything
            this.answerService.save(itemId, attemptId, { answer: currentAnswer.answer ?? '', state: currentAnswer.state ?? '' });
        }
        return of(undefined);
      }),
      switchMap(() => {
        const body = { answer: newAnswer.answer ?? '', state: newAnswer.state ?? '' };
        return this.currentAnswerService.update(itemId, attemptId, body).pipe(map(() => newAnswer));
      }),
    );
  }

}

declare global {
  interface Window {
    taskSaveIntervalInSec?: number,
  }
}

