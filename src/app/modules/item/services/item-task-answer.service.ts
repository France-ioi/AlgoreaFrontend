import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, forkJoin, interval, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, mapTo, shareReplay, skip, switchMap, withLatestFrom } from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { AnswerTokenService } from '../http-services/answer-token.service';
import { Answer, GetCurrentAnswerService } from '../http-services/get-current-answer.service';
import { SaveGradeService } from '../http-services/save-grade.service';
import { UpdateCurrentAnswerService } from '../http-services/update-current-answer.service';
import { ItemTaskInitService } from './item-task-init.service';

const answerAndStateSaveInterval = 1*SECONDS;

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private task$ = this.taskInitService.task$;
  private config$ = this.taskInitService.config$;
  private taskToken$ = this.taskInitService.taskToken$;

  private currentAnswer$: Observable<Answer | null> = this.config$.pipe(
    switchMap(({ route, attemptId }) => this.getCurrentAnswerService.get(route.id, attemptId).pipe(
      catchError(() => this.task$.pipe(
        switchMap(task => combineLatest([ task.getAnswer(), task.getState() ])),
        switchMap(([ answer, state ]) => this.updateCurrentAnswerService.update(route.id, attemptId, { answer, state })),
        switchMap(() => this.getCurrentAnswerService.get(route.id, attemptId)),
      )),
    )),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );

  private reloadAnswerAndStateSubject = new Subject<void>();
  private reloadAnswerAndState$ = combineLatest([ this.currentAnswer$, this.task$ ]).pipe(
    repeatLatestWhen(this.reloadAnswerAndStateSubject),
    switchMap(([ currentAnswer, task ]) =>
      (currentAnswer?.state ? task.reloadState(currentAnswer.state).pipe(mapTo({ currentAnswer, task })) : of({ currentAnswer, task }))
    ),
    switchMap(({ currentAnswer, task }) =>
      (currentAnswer?.answer ? task.reloadAnswer(currentAnswer.answer).pipe(mapTo(undefined)) : of(undefined))
    ),
    shareReplay(1),
  );

  private saveAnswerAndStateInterval$ = this.reloadAnswerAndState$.pipe(
    switchMap(() => this.task$),
    switchMap(task => interval(answerAndStateSaveInterval).pipe(mapTo(task))),
    switchMap(task => forkJoin([ task.getAnswer(), task.getState() ])),
    distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
    skip(1), // avoid saving an answer right after fetching it
    withLatestFrom(this.config$),
    switchMap(([ [ answer, state ], { route, attemptId }]) =>
      this.updateCurrentAnswerService.update(route.id, attemptId, { answer, state })
    ),
  );

  private subscriptions = [
    this.reloadAnswerAndState$.subscribe({ error: err => this.taskInitService.setError(err) }),
    this.saveAnswerAndStateInterval$.subscribe({ error: err => this.taskInitService.setError(err) }),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private getCurrentAnswerService: GetCurrentAnswerService,
    private updateCurrentAnswerService: UpdateCurrentAnswerService,
    private answerTokenService: AnswerTokenService,
    private saveGradeService: SaveGradeService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  submitAnswer(): Observable<unknown> {
    return this.task$.pipe(
      // Step 1: get answer from task
      switchMap(task => combineLatest([ task.getAnswer(), this.taskToken$ ]).pipe(

        // Step 2: generate answer token with backend
        switchMap(([ answer, taskToken ]) => this.answerTokenService.generate(answer, taskToken).pipe(

          // Step 3: get answer grade with answer token from task
          switchMap(answerToken => task.gradeAnswer(answer, answerToken).pipe(

            // Step 4: Save grade in backend
            switchMap(grade => this.saveGradeService.save(
              taskToken,
              answerToken,
              grade.score,
              grade.scoreToken ?? undefined,
            )),
          )),
        )),
      )),
    );
  }

  reloadAnswer(): Observable<unknown> {
    this.reloadAnswerAndStateSubject.next();
    return EMPTY;
  }
}
