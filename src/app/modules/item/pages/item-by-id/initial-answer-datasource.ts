import { Injectable, OnDestroy } from '@angular/core';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { CurrentAnswerService } from '../../http-services/current-answer.service';
import { GetAnswerService } from '../../http-services/get-answer.service';
import { Answer } from '../../services/item-task.service';

type Strategy =
  { tag: 'EmptyInitialAnswer'|'Wait'|'NotApplicable' } |
  { tag: 'LoadCurrent', itemId: string, attemptId: string } |
  { tag: 'LoadById', answerId: string } |
  { tag: 'LoadBest', itemId: string, participantId?: string};

@Injectable()
export class InitialAnswerDataSource implements OnDestroy {

  private readonly itemInfo$ = new Subject<{ route: FullItemRoute, isTask: boolean|undefined }>();
  private readonly destroyed$ = new Subject<void>();

  readonly answer$ = combineLatest([ this.itemInfo$, this.groupWatchingService.isWatching$ ]).pipe(
    /* we do the computation in 2 stages to prevent cancelling requests which shouldn't have been cancelled */
    map(([{ route, isTask }, isWatching ]): Strategy => {
      if (isTask === false) return { tag: 'NotApplicable' };
      if (!route.answer) {
        if (isWatching) return { tag: 'EmptyInitialAnswer' };
        if (isTask === undefined) return { tag: 'Wait' };
        return route.attemptId ? { tag: 'LoadCurrent', itemId: route.id, attemptId: route.attemptId } : { tag: 'Wait' };
      }
      if (route.answer.id) return { tag: 'LoadById', answerId: route.answer.id };
      return { tag: 'LoadBest', itemId: route.id, participantId: route.answer.participantId };
    }),
    distinctUntilChanged((s1, s2) => JSON.stringify(s1) === JSON.stringify(s2)),
    switchMap(strategy => {
      if (strategy.tag === 'EmptyInitialAnswer') return of(null); // null -> no initial answer
      if (strategy.tag === 'LoadCurrent') return this.getCurrentAnswer(strategy.itemId, strategy.attemptId);
      if (strategy.tag === 'LoadById') return this.getAnswerService.get(strategy.answerId);
      if (strategy.tag === 'LoadBest') return this.getAnswerService.getBest(strategy.itemId, { watchedGroupId: strategy.participantId });
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
    private groupWatchingService: GroupWatchingService,
    private currentAnswerService: CurrentAnswerService,
    private getAnswerService: GetAnswerService,
  ) {}

  setInfo(route: FullItemRoute, isTask: boolean|undefined): void {
    this.itemInfo$.next({ route, isTask });
  }

  ngOnDestroy(): void {
    this.itemInfo$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private getCurrentAnswer(itemId: string, attemptId: string): Observable<Answer | null> {
    return this.currentAnswerService.get(itemId, attemptId).pipe(
      catchError(error => {
        // currently, the backend returns a 403 status when no current answer exist for user+item+attempt
        if (errorIsHTTPForbidden(error)) return of(null);
        throw error;
      })
    );
  }

}
