import { Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
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
  switchMap,
} from 'rxjs';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { CurrentAnswerService } from '../data-access/current-answer.service';
import { GetAnswerService } from '../data-access/get-answer.service';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { loadAnswerAsCurrentFromNavigationState } from 'src/app/models/routing/item-navigation-state';
import { areStateAnswerEqual } from '../models/answers';
import { Answer } from './item-task.service';
import { AnswerService } from '../data-access/answer.service';

type Strategy =
  { tag: 'EmptyInitialAnswer'|'Wait'|'NotApplicable' } |
  { tag: 'LoadCurrent', itemId: string, attemptId: string } |
  { tag: 'LoadById', answerId: string } |
  { tag: 'LoadAsCurrent', itemId: string, attemptId: string, answerId: string } |
  { tag: 'LoadBest', itemId: string, participantId?: string};

@Injectable()
export class InitialAnswerDataSource implements OnDestroy {
  private store = inject(Store);
  private currentAnswerService = inject(CurrentAnswerService);
  private getAnswerService = inject(GetAnswerService);
  private answerService = inject(AnswerService);

  private readonly itemInfo$ = new ReplaySubject<{ route: FullItemRoute, isTask: boolean|undefined }>();
  /** undefined until the loaded task reports whether it saves editor history */
  private readonly savesEditorHistory$ = new BehaviorSubject<boolean | undefined>(undefined);
  private flagScopeKey: string | undefined;

  readonly answer$ = combineLatest([
    this.itemInfo$,
    this.store.select(fromObservation.selectIsObserving),
    this.savesEditorHistory$,
  ]).pipe(
    /* we do the computation in 2 stages to prevent cancelling requests which shouldn't have been cancelled */
    map(([ { route: { id, attemptId, answer }, isTask }, isObserving, savesEditorHistory ]): Strategy => {
      if (isTask === false) return { tag: 'NotApplicable' };
      if (!answer) {
        const loadAnswerAsCurrent = loadAnswerAsCurrentFromNavigationState();
        if (loadAnswerAsCurrent) {
          if (!attemptId) return { tag: 'Wait' };
          // Edit-it backup/update depends on the flag; wait until metadata is known.
          if (savesEditorHistory === undefined) return { tag: 'Wait' };
          // Task owns WIP: load the submission editable without a platform WIP backup.
          if (savesEditorHistory) return { tag: 'LoadById', answerId: loadAnswerAsCurrent };
          return { tag: 'LoadAsCurrent', itemId: id, attemptId, answerId: loadAnswerAsCurrent };
        }
        if (isObserving) return { tag: 'EmptyInitialAnswer' };
        if (isTask === undefined) return { tag: 'Wait' };
        if (!attemptId) return { tag: 'Wait' };
        // Current-answer reload waits for metadata on a fresh load.
        if (savesEditorHistory === undefined) return { tag: 'Wait' };
        if (savesEditorHistory) return { tag: 'EmptyInitialAnswer' };
        return { tag: 'LoadCurrent', itemId: id, attemptId };
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
    takeUntilDestroyed(),
    shareReplay(1),
  );

  readonly error$: Observable<{ error: unknown }|undefined> = this.answer$.pipe(
    map(() => undefined), // non-errors -> undefined
    distinctUntilChanged(),
    catchError((e: unknown) => of({ error: e })), // convert stream error to value
  );

  setInfo(route: FullItemRoute, isTask: boolean|undefined): void {
    const scopeKey = `${ route.id }:${ route.attemptId ?? '' }`;
    if (this.flagScopeKey !== scopeKey) {
      this.flagScopeKey = scopeKey;
      this.savesEditorHistory$.next(undefined);
    }
    this.itemInfo$.next({ route, isTask });
  }

  /** Called once the task metadata has been negotiated (from the item-display provider tree). */
  setSavesEditorHistory(value: boolean): void {
    this.savesEditorHistory$.next(value);
  }

  /** Reset before a new task instance reports metadata (avoids a stale flag across remounts). */
  clearSavesEditorHistory(): void {
    this.savesEditorHistory$.next(undefined);
  }

  ngOnDestroy(): void {
    this.itemInfo$.complete();
    this.savesEditorHistory$.complete();
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
