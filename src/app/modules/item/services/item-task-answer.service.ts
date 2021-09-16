import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, forkJoin, interval, Observable, Subscription } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, mapTo, shareReplay, skip, switchMap, withLatestFrom } from 'rxjs/operators';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { CreateCurrentAnswerService } from '../http-services/create-current-answer.service';
import { Answer, GetCurrentAnswerService } from '../http-services/get-current-answer.service';
import { UpdateCurrentAnswerService } from '../http-services/update-current-answer.service';
import { ItemTaskService } from './item-task.service';

const answerAndStateSaveInterval = 1*SECONDS;

@Injectable()
export class ItemTaskAnswerService implements OnDestroy {
  private task$ = this.itemTaskService.task$;

  private currentAnswer$: Observable<Answer | null> = combineLatest([ this.itemTaskService.config$, this.userSession.userProfile$ ]).pipe(
    switchMap(([{ itemId, attemptId }, profile ]) => this.getCurrentAnswerService.get(itemId, attemptId, profile.groupId)),
    shareReplay(1), // avoid duplicate xhr calls on multiple subscriptions.
  );
  private createCurrentAnswerIfNoneExists$ = this.currentAnswer$.pipe(
    filter(currentAnswer => currentAnswer === null),
    switchMap(() => this.task$),
    switchMap(task => combineLatest([ task.getAnswer(), task.getState(), this.itemTaskService.config$ ])),
    switchMap(([ answer, state, { itemId, attemptId }]) => this.createCurrentAnswerService.create(itemId, attemptId, { answer, state })),
  );
  private answer$: Observable<NonNullable<Answer['answer']>> = this.currentAnswer$.pipe(map(a => a?.answer), filter(Boolean));
  private state$: Observable<NonNullable<Answer['state']>> = this.currentAnswer$.pipe(map(a => a?.state), filter(Boolean));

  private reloadState$ = combineLatest([ this.task$, this.state$ ]).pipe(
    switchMap(([ task, state ]) => task.reloadState(state)),
    shareReplay(1), // avoid duplicate `reloadState` calls on multiple subscriptions.
  );
  private reloadAnswerAndState$ = this.reloadState$.pipe(
    concatMap(() => combineLatest([ this.task$, this.answer$ ])),
    switchMap(([ task, answer ]) => task.reloadAnswer(answer)),
    shareReplay(1), // avoid duplicate `reloadAnswer` calls on multiple subscriptions.
  );

  private saveAnswerAndStateInterval$ = this.reloadAnswerAndState$.pipe(
    switchMap(() => this.task$),
    switchMap(task => interval(answerAndStateSaveInterval).pipe(mapTo(task))),
    switchMap(task => forkJoin([ task.getAnswer(), task.getState() ])),
    distinctUntilChanged(([ answer1, state1 ], [ answer2, state2 ]) => answer1 === answer2 && state1 === state2),
    skip(1), // avoid saving an answer right after fetching it
    withLatestFrom(this.itemTaskService.config$),
    switchMap(([ [ answer, state ], { itemId, attemptId }]) =>
      this.updateCurrentAnswerService.update(itemId, attemptId, { answer, state })
    ),
  );

  private subscriptions: Subscription[] = [];
  private initialized = false;

  constructor(
    private itemTaskService: ItemTaskService,
    private getCurrentAnswerService: GetCurrentAnswerService,
    private createCurrentAnswerService: CreateCurrentAnswerService,
    private userSession: UserSessionService,
    private updateCurrentAnswerService: UpdateCurrentAnswerService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.subscriptions.push(
      this.createCurrentAnswerIfNoneExists$.subscribe(),
      this.reloadAnswerAndState$.subscribe({ error: err => this.itemTaskService.setError(err) }),
      this.saveAnswerAndStateInterval$.subscribe({ error: err => this.itemTaskService.setError(err) }),
    );
  }
}
