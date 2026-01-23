import { Injectable, OnDestroy } from '@angular/core';
import {
  catchError,
  combineLatest,
  concat,
  distinctUntilChanged,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GetAnswerService } from '../data-access/get-answer.service';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { loadAnswerAsCurrentFromNavigationState } from 'src/app/models/routing/item-navigation-state';
import { Answer, areStateAnswerEqual } from '../models/answers';
import { AnswerService } from '../data-access/answer.service';

type Strategy =
  { tag: 'EmptyInitialAnswer'|'Wait'|'NotApplicable' } |
  { tag: 'LoadCurrent', itemId: string, attemptId: string } |
  { tag: 'LoadById', answerId: string } |
  { tag: 'LoadAsCurrent', itemId: string, attemptId: string, answerId: string } |
  { tag: 'LoadBest', itemId: string, participantId?: string};

@Injectable()
export class InitialAnswerDataSource implements OnDestroy {

  private readonly itemInfo$ = new ReplaySubject<{ route: FullItemRoute, isTask: boolean|undefined }>();
  private readonly destroyed$ = new Subject<void>();

  readonly answer$ = combineLatest([ this.itemInfo$, this.store.select(fromObservation.selectIsObserving) ]).pipe(
    /* we do the computation in 2 stages to prevent cancelling requests which shouldn't have been cancelled */
    map(([{ route: { id, attemptId, answer }, isTask }, isObserving ]): Strategy => {
      if (isTask === false) return { tag: 'NotApplicable' };
      if (!answer) {
        const loadAnswerAsCurrent = loadAnswerAsCurrentFromNavigationState();
        if (loadAnswerAsCurrent) {
          return attemptId ? { tag: 'LoadAsCurrent', itemId: id, attemptId, answerId: loadAnswerAsCurrent } : { tag: 'Wait' };
        }
        if (isObserving) return { tag: 'EmptyInitialAnswer' };
        if (isTask === undefined) return { tag: 'Wait' };
        return attemptId ? { tag: 'LoadCurrent', itemId: id, attemptId } : { tag: 'Wait' };
      }
      if (answer.id) return { tag: 'LoadById', answerId: answer.id };
      return { tag: 'LoadBest', itemId: id, participantId: answer.best?.id };
    }),
    distinctUntilChanged((s1, s2) => JSON.stringify(s1) === JSON.stringify(s2)),
    switchMap(strategy => {
      if (strategy.tag === 'EmptyInitialAnswer') return of(null); // null -> no initial answer
      if (strategy.tag === 'LoadCurrent') return concat(of(undefined), this.currentAnswerService.get(strategy.itemId, strategy.attemptId));
      if (strategy.tag === 'LoadById') return concat(of(undefined), this.getAnswerService.get(strategy.answerId));
      if (strategy.tag === 'LoadAsCurrent') {
        return concat(of(undefined), this.getAnswerAndSaveAsCurrent(strategy.itemId, strategy.attemptId, strategy.answerId));
      }
      if (strategy.tag === 'LoadBest') {
        return concat(of(undefined), this.getAnswerService.getBest(strategy.itemId, { watchedGroupId: strategy.participantId }));
      }
      return of(undefined); // "Wait" and "NotApplicable" cases - undefined -> not defined yet
    }),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  readonly error$: Observable<{ error: unknown }|undefined> = this.answer$.pipe(
    map(() => undefined), // non-errors -> undefined
    distinctUntilChanged(),
    catchError((e: unknown) => of({ error: e })), // convert stream error to value
  );

  constructor(
    private store: Store,
    private currentAnswerService: CurrentAnswerService,
    private getAnswerService: GetAnswerService,
    private answerService: AnswerService,
  ) {}

  setInfo(route: FullItemRoute, isTask: boolean|undefined): void {
    this.itemInfo$.next({ route, isTask });
  }

  ngOnDestroy(): void {
    this.itemInfo$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private getAnswerAndSaveAsCurrent(itemId: string, attemptId: string, answerId: string): Observable<Answer> {
    return forkJoin([
      this.getAnswerService.get(answerId),
      this.currentAnswerService.get(itemId, attemptId),
    ]).pipe(
      switchMap(([ newAnswer, currentAnswer ]) => {
        if (currentAnswer) {
          return areStateAnswerEqual(currentAnswer, newAnswer) ?
            EMPTY : // do not do anything
            this.answerService.save(itemId, attemptId, { answer: currentAnswer.answer ?? '', state: currentAnswer.state ?? '' }).pipe(
              map(() => newAnswer)
            );
        }
        return of(newAnswer);
      }),
      switchMap(newAnswer => {
        const body = { answer: newAnswer.answer ?? '', state: newAnswer.state ?? '' };
        return this.currentAnswerService.update(itemId, attemptId, body).pipe(map(() => newAnswer));
      }),
    );
  }

}
