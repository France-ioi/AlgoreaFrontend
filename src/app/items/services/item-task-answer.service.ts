import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, forkJoin, interval, merge, Observable, of, ReplaySubject, Subject } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  delayWhen,
  distinctUntilChanged,
  filter,
  map,
  retry,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { SECONDS } from 'src/app/utils/duration';
import { repeatLatestWhen } from 'src/app/utils/operators/repeatLatestWhen';
import { AnswerTokenService } from '../data-access/answer-token.service';
import { AnswerService } from '../data-access/answer.service';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GradeService } from '../data-access/grade.service';
import { ItemTaskConfig, ItemTaskInitService } from './item-task-init.service';
import { Answer } from './item-task.service';
import { areStateAnswerEqual } from '../models/answers';

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

  private saved$ = new ReplaySubject<{ answer: string, state: string }>();
  private saveError$ = new Subject<Error>();

  private loadedTask$ = this.taskInitService.loadedTask$.pipe(
    catchError(() => EMPTY), // error handled in subscriptions
    takeUntil(this.error$)
  );

  private config$ = this.taskInitService.config$.pipe(
    takeUntil(this.error$),
    filter((config): config is RunningItemTaskConfig => config.attemptId !== undefined)
  );
  private taskToken$ = this.taskInitService.taskToken$.pipe(takeUntil(this.error$));

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

  private canStartSaveInterval$: Observable<void> = this.config$.pipe(
    take(1),
    filter(({ readOnly }) => !readOnly),
    map(() => undefined),
    delayWhen(() => combineLatest([ this.saved$, this.initializedTaskState$, this.initializedTaskAnswer$ ])),
  );

  private refreshAnswerAndStatePeriod = Math.max(answerAndStateSaveInterval, (window.taskSaveIntervalInSec ?? 0)*SECONDS);
  private answerOrStateChange$ = interval(this.refreshAnswerAndStatePeriod).pipe(
    takeUntil(this.destroyed$),
    switchMap(() => this.loadedTask$),
    switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() })),
    distinctUntilChanged((a, b) => a.answer === b.answer && a.state === b.state),
  );

  private autoSaveInterval$: Observable<{ answer: string, state: string } | Error> = this.canStartSaveInterval$.pipe(
    switchMap(() => this.saved$),
    repeatLatestWhen(this.saveError$),
    switchMap(saved => this.answerOrStateChange$.pipe(
      filter(current => current.answer !== saved.answer || current.state !== saved.state),
      take(1),
    )),
    withLatestFrom(this.config$),
    catchError(() => EMPTY),
    switchMap(([ current, { route, attemptId }]) => this.currentAnswerService.update(route.id, attemptId, current).pipe(
      map(() => current),
      catchError(() => of(new Error('auto save failed'))),
    )),
  );

  readonly saveAnswerAndStateInterval$ = merge(
    this.saved$.pipe(map(() => ({ success: true }))),
    this.saveError$.pipe(map(() => ({ success: false }))),
  );

  private subscriptions = [
    this.initializedTaskAnswer$.subscribe(),
    this.initializedTaskState$.subscribe({
      error: err => this.errorSubject.next(err),
    }),
    this.taskInitService.loadedTask$.subscribe({
      error: err => this.errorSubject.next(err),
    }),
    this.initialAnswer$
      .subscribe({
        next: initial => this.saved$.next({ answer: initial?.answer ?? '', state: initial?.state ?? '' }),
        error: err => this.errorSubject.next(err),
      }),
    this.autoSaveInterval$.subscribe(savedOrError => {
      if (savedOrError instanceof Error) this.saveError$.next(savedOrError);
      else this.saved$.next(savedOrError);
    }),
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
    combineLatest([ grade$, saveGrade$, this.saveAnswerAndState() ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere by returning saveGrade$
      .subscribe(([ grade ]) => {
        if (grade.score !== undefined) this.scoreChange.next(grade.score);
      });
    return saveGrade$;
  }

  clearAnswer(): Observable<unknown> {
    return this.loadedTask$.pipe(take(1), switchMap(task => task.reloadAnswer('')));
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
    return combineLatest([ this.saved$, this.loadedTask$, this.config$ ]).pipe(
      take(1),
      // save action must applied straight away ONLY if there is an available config & task & saved-value couple
      // if such couple is not available straight away, it means the user has navigated so quickly that the task could not be initialized
      // therefore, no user action on the task could have been made, so there's no treatment to apply (catchError -> Empty)
      timeout(1),
      catchError(() => EMPTY),

      switchMap(([ saved, task, config ]) => forkJoin({
        config: of(config),
        saved: of(saved),
        current: forkJoin({ answer: task.getAnswer(), state: task.getState() }),
      })),

      switchMap(({ saved, current, config: { route, attemptId, readOnly } }) => {
        if (readOnly) return of({ saving: false });
        const currentIsSaved = saved.answer === current.answer && saved.state === current.state;
        if (currentIsSaved) return of({ saving: false });

        return this.currentAnswerService.update(route.id, attemptId, current).pipe(
          map(() => ({ saving: false })),
          startWith({ saving: true }),
        );
      }),
      defaultIfEmpty({ saving: false }), // when a timeout is caught, the observable is empty
      takeUntil(this.destroyed$),
      shareReplay(1),
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

