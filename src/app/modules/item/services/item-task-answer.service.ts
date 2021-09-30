import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, forkJoin, interval, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, mapTo, shareReplay, skip, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { AnswerTokenService } from '../http-services/answer-token.service';
import { Answer, CurrentAnswerService } from '../http-services/current-answer.service';
import { GradeService } from '../http-services/grade.service';
import { ItemTaskInitService } from './item-task-init.service';

const answerAndStateSaveInterval = 1*SECONDS;

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.asObservable();

  private task$ = this.taskInitService.task$.pipe(takeUntil(this.error$));
  private config$ = this.taskInitService.config$.pipe(takeUntil(this.error$));
  private taskToken$ = this.taskInitService.taskToken$.pipe(takeUntil(this.error$));

  private currentAnswer$: Observable<Answer | null> = this.config$.pipe(
    switchMap(({ route, attemptId }) => this.currentAnswerService.get(route.id, attemptId)),
    catchError(error => {
      // currently, the backend returns a 403 status when no current answer exist for user+item+attempt
      if (errorIsHTTPForbidden(error)) return of(null);
      throw error;
    }),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );

  private reloadAnswerAndState$ = new Subject<void>();
  private reloadedAnswerAndState$ = combineLatest([ this.currentAnswer$, this.task$ ]).pipe(
    repeatLatestWhen(this.reloadAnswerAndState$),
    switchMap(([ currentAnswer, task ]) =>
      (currentAnswer?.state ? task.reloadState(currentAnswer.state).pipe(mapTo({ currentAnswer, task })) : of({ currentAnswer, task }))
    ),
    switchMap(({ currentAnswer, task }) =>
      (currentAnswer?.answer ? task.reloadAnswer(currentAnswer.answer).pipe(mapTo(undefined)) : of(undefined))
    ),
    shareReplay(1),
  );

  private saveAnswerAndStateInterval$ = this.reloadedAnswerAndState$.pipe(
    switchMap(() => this.task$),
    switchMap(task => interval(answerAndStateSaveInterval).pipe(mapTo(task))),
    switchMap(task => forkJoin([ task.getAnswer(), task.getState() ])),
    distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
    skip(1), // avoid saving an answer right after fetching it
    withLatestFrom(this.config$),
    switchMap(([ [ answer, state ], { route, attemptId }]) =>
      this.currentAnswerService.update(route.id, attemptId, { answer, state })
    ),
  );

  private subscriptions = [
    this.reloadAnswerAndState$.subscribe({ error: err => this.errorSubject.next(err) }),
    this.saveAnswerAndStateInterval$.subscribe({ error: err => this.errorSubject.next(err) }),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private currentAnswerService: CurrentAnswerService,
    private answerTokenService: AnswerTokenService,
    private gradeService: GradeService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.errorSubject.complete();
    this.reloadAnswerAndState$.complete();
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
    return this.task$.pipe(
      take(1),
      switchMap(task => task.reloadAnswer(''))
    );
  }
}
