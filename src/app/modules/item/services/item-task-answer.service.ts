import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, forkJoin, interval, merge, Observable, of, ReplaySubject, Subject } from 'rxjs';
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  mapTo,
  shareReplay,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { AnswerTokenService } from '../http-services/answer-token.service';
import { Answer, CurrentAnswerService } from '../http-services/current-answer.service';
import { GetAnswerService } from '../http-services/get-answer.service';
import { GradeService } from '../http-services/grade.service';
import { ItemTaskInitService } from './item-task-init.service';

const answerAndStateSaveInterval = (): number => ((window as unknown as Record<string, number>).__DELAY ?? 5)*SECONDS;
const loadAnswerError = new Error('load answer forbidden');

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private destroyed$ = new Subject<void>();

  private errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.pipe(filter(error => error !== loadAnswerError));
  readonly loadAnswerByIdError$ = this.errorSubject.pipe(filter(error => error === loadAnswerError));

  private scoreChange = new Subject<number>();
  readonly scoreChange$ = this.scoreChange.asObservable();

  private saved$ = new ReplaySubject<{ answer: string, state: string }>();
  private saveError$ = new Subject<Error>();

  private task$ = this.taskInitService.task$.pipe(takeUntil(this.error$));
  private config$ = this.taskInitService.config$.pipe(takeUntil(this.error$));
  private taskToken$ = this.taskInitService.taskToken$.pipe(takeUntil(this.error$));

  private initialAnswer$: Observable<Answer | null> = this.config$.pipe(
    switchMap(({ route, attemptId, shouldLoadAnswer }) => {
      if (!shouldLoadAnswer) return of(null);
      if (route.answerId) {
        return this.getAnswerService.get(route.answerId).pipe(
          catchError(error => {
            if (errorIsHTTPForbidden(error)) throw loadAnswerError;
            throw error;
          }),
        );
      }

      return this.currentAnswerService.get(route.id, attemptId).pipe(
        catchError(error => {
          // currently, the backend returns a 403 status when no current answer exist for user+item+attempt
          if (errorIsHTTPForbidden(error)) return of(null);
          throw error;
        })
      );
    }),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );

  private initializedTaskState$ = combineLatest([ this.initialAnswer$, this.task$ ]).pipe(
    switchMap(([ initialAnswer, task ]) =>
      (initialAnswer?.state ? task.reloadState(initialAnswer.state).pipe(mapTo(undefined)) : of(undefined))
    ),
    shareReplay(1),
  );
  private initializedTaskAnswer$ = combineLatest([ this.initialAnswer$, this.task$ ]).pipe(
    delayWhen(() => this.initializedTaskState$),
    switchMap(([ initialAnswer, task ]) =>
      (initialAnswer?.answer ? task.reloadAnswer(initialAnswer.answer).pipe(mapTo(undefined)) : of(undefined))
    ),
    shareReplay(1),
  );

  private canStartSaveInterval$: Observable<void> = this.config$.pipe(
    take(1),
    filter(({ readOnly }) => !readOnly),
    mapTo(undefined),
    delayWhen(() => combineLatest([ this.saved$, this.initializedTaskState$, this.initializedTaskAnswer$ ])),
  );

  private answerOrStateChange$ = interval(answerAndStateSaveInterval()).pipe(
    takeUntil(this.destroyed$),
    switchMapTo(this.task$),
    switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() })),
    distinctUntilChanged((a, b) => a.answer === b.answer && a.state === b.state),
  );

  private autoSaveInterval$: Observable<{ answer: string, state: string } | Error> = this.canStartSaveInterval$.pipe(
    switchMapTo(this.saved$),
    repeatLatestWhen(this.saveError$),
    switchMap(saved => this.answerOrStateChange$.pipe(
      filter(current => current.answer !== saved.answer || current.state !== saved.state),
      take(1),
    )),
    withLatestFrom(this.config$),
    switchMap(([ current, { route, attemptId }]) => this.currentAnswerService.update(route.id, attemptId, current).pipe(
      mapTo(current),
      catchError(() => of(new Error('auto save failed'))),
    )),
  );

  readonly saveAnswerAndStateInterval$ = merge(
    this.saved$.pipe(mapTo({ success: true })),
    this.saveError$.pipe(mapTo({ success: false })),
  );

  private subscriptions = [
    this.initializedTaskAnswer$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.initializedTaskState$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.initialAnswer$
      .pipe(filter(isNotNull))
      .subscribe(initial => this.saved$.next({ answer: initial.answer ?? '', state: initial.state ?? '' })),
    this.autoSaveInterval$.subscribe(savedOrError => {
      if (savedOrError instanceof Error) this.saveError$.next(savedOrError);
      else this.saved$.next(savedOrError);
    }),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private currentAnswerService: CurrentAnswerService,
    private answerTokenService: AnswerTokenService,
    private gradeService: GradeService,
    private getAnswerService: GetAnswerService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.errorSubject.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
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
    const saveGrade$ = combineLatest([ this.taskToken$, answerToken$, grade$ ]).pipe(
      take(1),
      switchMap(([ taskToken, answerToken, grade ]) => this.gradeService.save(
        taskToken,
        answerToken,
        grade.score,
        grade.scoreToken ?? undefined,
      )),
      shareReplay(1),
    );
    combineLatest([ grade$, saveGrade$ ]).subscribe(([ grade ]) => {
      if (grade.score !== undefined) this.scoreChange.next(grade.score);
    });
    return saveGrade$;
  }

  clearAnswer(): Observable<unknown> {
    return this.task$.pipe(take(1), switchMap(task => task.reloadAnswer('')));
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
    return combineLatest([ this.saved$, this.task$, this.config$ ]).pipe(
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

      switchMap(({ saved, current, config: { route, attemptId } }) => {
        const currentIsSaved = saved.answer === current.answer && saved.state === current.state;
        if (currentIsSaved) return of({ saving: false });

        return this.currentAnswerService.update(route.id, attemptId, current).pipe(
          mapTo({ saving: false }),
          startWith({ saving: true }),
        );
      }),
      shareReplay(1),
    );
  }
}
