import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, forkJoin, interval, merge, Observable, of, race, Subject } from 'rxjs';
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  shareReplay,
  skip,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { AnswerTokenService } from '../http-services/answer-token.service';
import { Answer, CurrentAnswerService } from '../http-services/current-answer.service';
import { GetAnswerService } from '../http-services/get-answer.service';
import { GradeService } from '../http-services/grade.service';
import { ItemTaskInitService } from './item-task-init.service';

const answerAndStateSaveInterval = (): number => ((window as unknown as Record<string, number>).__DELAY ?? 1)*SECONDS;
const loadAnswerError = new Error('load answer forbidden');

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private destroyed$ = new Subject<void>();

  private errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.pipe(filter(error => error !== loadAnswerError));
  readonly loadAnswerByIdError$ = this.errorSubject.pipe(filter(error => error === loadAnswerError));

  private scoreChange = new Subject<number>();
  readonly scoreChange$ = this.scoreChange.asObservable();

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

  private savedAnswerAndStateInterval$ = this.task$.pipe(
    delayWhen(() => combineLatest([ this.initializedTaskState$, this.initializedTaskAnswer$ ])),
    repeatLatestWhen(interval(answerAndStateSaveInterval()).pipe(takeUntil(this.destroyed$))),
    switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() })),
    distinctUntilChanged((a, b) => a.answer === b.answer && a.state === b.state),
    skip(1), // avoid saving an answer right after fetching it
    withLatestFrom(this.config$),
    switchMap(([{ answer, state }, { route, attemptId }]) => this.currentAnswerService.update(route.id, attemptId, { answer, state }).pipe(
      mapTo({ answer, state }),
    )),
    shareReplay(1),
  );

  private savedAnswerAndState$ = merge(
    this.savedAnswerAndStateInterval$,
    this.initialAnswer$.pipe(
      filter(initialAnswer => initialAnswer === null),
      switchMapTo(this.task$),
      switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() })),
      withLatestFrom(this.config$),
      switchMap(([ body, { route, attemptId }]) => this.currentAnswerService.update(route.id, attemptId, body).pipe(mapTo(body))),
    ),
    this.initialAnswer$.pipe(map(initial => (initial ? { answer: initial.answer, state: initial.state } : undefined))),
  ).pipe(shareReplay(1));
  readonly saveAnswerAndStateInterval$ = this.savedAnswerAndStateInterval$.pipe(
    mapTo({ success: true }),
    catchError(() => of({ success: false })),
  );

  private subscriptions = [
    this.initializedTaskAnswer$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.initializedTaskState$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.savedAnswerAndState$.subscribe({ error: err => this.errorSubject.next(err) }),
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
    return forkJoin({
      saved: race(this.savedAnswerAndState$.pipe(take(1)), of(undefined)),
      current: this.task$.pipe(take(1), switchMap(task => forkJoin({ answer: task.getAnswer(), state: task.getState() }))),
    }).pipe(
      withLatestFrom(this.config$),
      switchMap(([{ saved, current }, { route, attemptId }]) => {
        const currentIsSaved = (saved && saved.answer === current.answer && saved.state === current.state);
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
