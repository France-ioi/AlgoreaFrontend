import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators';
import { TaskTokenService, TaskToken } from '../http-services/task-token.service';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskTokenService implements OnDestroy {

  readonly taskToken$: Observable<TaskToken> = this.initService.config$.pipe(
    // build strategy separately from switchMap to prevent cancellation of the request
    map(({ readOnly, initialAnswer, attemptId, route }) => {
      if (readOnly) {
        // if readonly -> if initialAnswer is still unknown, wait the next config update to generate token
        if (initialAnswer === undefined) return { strategy: 'wait' as const };
        // if readonly -> if there is an initial answer,
        if (initialAnswer !== null) return { strategy: 'answerToken' as const, answerId: initialAnswer.id };
      }
      // if the attempt id is not known yet: wait
      if (attemptId === undefined) return { strategy: 'wait' as const };
      // if we are editing (= not in readOnly) -> we need a token for our user
      // if there are no answer loaded -> we currently want an empty task, so using our own task token
      return { strategy: 'regularToken' as const, itemId: route.id, attemptId };
    }),
    distinctUntilChanged((prev, cur) => prev.strategy === cur.strategy),
    switchMap(s => {
      if (s.strategy === 'answerToken') return this.taskTokenService.generateForAnswer(s.answerId);
      if (s.strategy === 'regularToken') return this.taskTokenService.generate(s.itemId, s.attemptId);
      return EMPTY; // s.strategy === 'wait'
    }),
    shareReplay(1),
  );

  private readonly taskTokenUpdate$ = combineLatest([ this.taskToken$, this.initService.task$ ]).pipe(
    switchMap(([ token, task ]) => task.updateToken(token)),
    map(() => undefined),
  );

  private readonly updateTokenSubscription = this.taskTokenUpdate$.subscribe();

  constructor(
    private initService: ItemTaskInitService,
    private taskTokenService: TaskTokenService,
  ) {}

  ngOnDestroy(): void {
    this.updateTokenSubscription.unsubscribe();
  }

}
