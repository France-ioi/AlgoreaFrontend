import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, forkJoin, interval, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, shareReplay, skip, switchMap, withLatestFrom } from 'rxjs/operators';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { CreateCurrentAnswerService } from '../http-services/create-current-answer.service';
import { GenerateAnswerTokenService } from '../http-services/generate-answer-token.service';
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

  private currentAnswer$: Observable<Answer | null> = combineLatest([ this.config$, this.userSession.userProfile$ ]).pipe(
    switchMap(([{ route, attemptId }, profile ]) => this.getCurrentAnswerService.get(route.id, attemptId, profile.groupId)),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );
  private createCurrentAnswerIfNoneExists$ = this.currentAnswer$.pipe(
    filter(currentAnswer => currentAnswer === null),
    switchMap(() => this.task$),
    switchMap(task => combineLatest([ task.getAnswer(), task.getState(), this.config$ ])),
    switchMap(([ answer, state, { route, attemptId }]) => this.createCurrentAnswerService.create(route.id, attemptId, { answer, state })),
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
    this.createCurrentAnswerIfNoneExists$.subscribe(),
    this.reloadAnswerAndState$.subscribe({ error: err => this.taskInitService.setError(err) }),
    this.saveAnswerAndStateInterval$.subscribe({ error: err => this.taskInitService.setError(err) }),
  ];

  constructor(
    private taskInitService: ItemTaskInitService,
    private getCurrentAnswerService: GetCurrentAnswerService,
    private createCurrentAnswerService: CreateCurrentAnswerService,
    private userSession: UserSessionService,
    private updateCurrentAnswerService: UpdateCurrentAnswerService,
    private generateAnswerTokenService: GenerateAnswerTokenService,
    private saveGradeService: SaveGradeService,
    private itemRouter: ItemRouter,
    private itemNavigationService: ItemNavigationService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  validate(mode: string): Observable<void> {
    switch (mode) {
      case 'cancel':
        return this.reloadAnswer().pipe(mapTo(undefined));

      case 'validate':
      case 'done':
        return this.submitAnswer().pipe(mapTo(undefined));

      case 'nextImmediate':
        return this.config$.pipe(
          switchMap(({ route }) => this.itemNavigationService.getNavigationNeighbors(route)),
          map(data => {
            if (data.right) this.itemRouter.navigateTo(data.right);
          }),
        );

      default:
        // Other unimplemented modes
        return EMPTY;
    }
  }

  private submitAnswer(): Observable<unknown> {
    return this.task$.pipe(
      // Step 1: get answer from task
      switchMap(task => combineLatest([ task.getAnswer(), this.taskToken$ ]).pipe(

        // Step 2: generate answer token with backend
        switchMap(([ answer, taskToken ]) => this.generateAnswerTokenService.generateToken(answer, taskToken).pipe(

          // Step 3: get grade for answer with answer token from task
          switchMap(answerToken => task.gradeAnswer(answer, answerToken).pipe(

            // Step 4: Save grade in backend
            switchMap(grade => this.saveGradeService.saveGrade(
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

  private reloadAnswer(): Observable<unknown> {
    this.reloadAnswerAndStateSubject.next();
    return EMPTY;
  }
}
