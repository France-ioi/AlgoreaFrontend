import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, EMPTY, forkJoin, interval, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  delayWhen,
  exhaustMap,
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
import { createSelector, Store } from '@ngrx/store';
import { SECONDS } from 'src/app/utils/duration';
import { AnswerTokenService } from '../data-access/answer-token.service';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GradeService, UnlockedItems } from '../data-access/grade.service';
import { ItemTaskConfig, ItemTaskInitService } from './item-task-init.service';
import { Answer } from './item-task.service';
import { areStateAnswerEqual } from '../models/answers';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { fromItemContent } from '../store';

export const answerAndStateSaveInterval = 60*SECONDS;

const selectIsCurrentResultValidated = createSelector(
  fromItemContent.selectActiveContentCurrentResult,
  result => !!result?.validated,
);

/** config of a task which has been started, so which has an attempt id set */
type RunningItemTaskConfig = ItemTaskConfig & { attemptId: string };

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private taskInitService = inject(ItemTaskInitService);
  private currentAnswerService = inject(CurrentAnswerService);
  private answerTokenService = inject(AnswerTokenService);
  private gradeService = inject(GradeService);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  private errorSubject = new Subject<unknown>();
  readonly error$ = this.errorSubject.asObservable();

  private scoreChange = new Subject<number>();
  readonly scoreChange$ = this.scoreChange.asObservable();

  private unlockedItems = new Subject<UnlockedItems>();
  readonly unlockedItems$ = this.unlockedItems.asObservable();

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
    switchMap(({ initialAnswer }) => {
      if (initialAnswer === undefined) return EMPTY;
      return of(initialAnswer);
    }),
    retry(3),
    takeUntilDestroyed(this.destroyRef),
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
    takeUntilDestroyed(this.destroyRef),
    shareReplay(1),
  );
  private initializedTaskAnswer$ = combineLatest([
    this.initialAnswer$.pipe(catchError(() => EMPTY)), // error is handled elsewhere
    this.loadedTask$,
  ]).pipe(
    delayWhen(() => this.initializedTaskState$),
    switchMap(([ initialAnswer, task ]) => (initialAnswer?.answer ?
      task.reloadAnswer(
        initialAnswer.answer,
        initialAnswer.type === 'Submission' ? { idUserAnswer: initialAnswer.id } : undefined,
      ).pipe(
        map(() => undefined),
        // if the task reports an error while loading the answer, consider it ready anyway (task will show the appropriate error message)
        catchError(() => of(undefined)),
      ) :
      of(undefined)
    )),
    takeUntilDestroyed(this.destroyRef),
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
    // exhaustMap: ignore interval ticks while a save is in flight (switchMap would cancel it).
    // Each save reads the latest task state/answer, so dropped ticks lose nothing.
    exhaustMap(() => this.saveTaskStateAnswerAsCurrent()),
    takeUntilDestroyed(this.destroyRef), // make sure the repetition ends when the service gets destroyed
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.errorSubject.complete();
  }

  submitAnswer(): Observable<void> {
    // snapshot the validation state *before* grading: a grade triggers `patchScore` which may flip `validated` to true.
    // We only want to refresh the token (to grant solution access) on the transition to validated, not on every submit.
    const wasValidated$ = this.store.select(selectIsCurrentResultValidated).pipe(take(1));

    // Step 1: get answer from task
    const answer$ = this.loadedTask$.pipe(
      take(1),
      switchMap(task => task.getAnswer()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1),
    );

    // Step 2: generate answer token with backend
    const answerToken$ = combineLatest([ this.taskToken$, answer$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answer ]) => this.answerTokenService.generate(answer, taskToken)),
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1),
    );

    // Step 3: get answer grade with answer token from task
    const grade$ = combineLatest([ this.loadedTask$, answer$, answerToken$ ]).pipe(
      take(1),
      switchMap(([ task, answer, answerToken ]) => task.gradeAnswer(answer, answerToken)),
      takeUntilDestroyed(this.destroyRef),
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
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1),
    );
    combineLatest([ grade$, saveGrade$, this.saveTaskStateAnswerAsCurrent(), wasValidated$ ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere by returning saveGrade$
      .subscribe(([ grade, saveGradeResult, , wasValidated ]) => {
        if (grade.score !== undefined) this.scoreChange.next(grade.score);
        if (saveGradeResult.unlockedItems.length > 0) this.unlockedItems.next(saveGradeResult.unlockedItems);
        // a newly-validated task grants solution access: regenerate the token so the task can expose the solution view
        // without a full reload. Use the backend's authoritative `validated` flag, and skip if it was already
        // validated (the previous token already granted access).
        if (saveGradeResult.validated && !wasValidated) this.taskInitService.refreshToken();
      });
    return saveGrade$.pipe(map(() => undefined));
  }

  clearAnswer(): Observable<void> {
    return this.loadedTask$.pipe(take(1), switchMap(task => task.reloadAnswer('')), map(() => undefined));
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

}

declare global {
  interface Window {
    taskSaveIntervalInSec?: number,
  }
}

