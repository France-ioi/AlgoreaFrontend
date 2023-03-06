import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
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

const loadForbiddenAnswerError = new Error('load answer forbidden');

type Strategy =
  { tag: 'EmptyInitialAnswer'|'Wait'|'NotApplicable' } |
  { tag: 'LoadCurrent', itemId: string, attemptId: string } |
  { tag: 'LoadById', answerId: string } |
  { tag: 'LoadBest', itemId: string, participantId?: string};

@Injectable()
export class InitialAnswerDataSource implements OnDestroy {

  private readonly itemRoute$ = new Subject<FullItemRoute>();
  private readonly isTask$ = new BehaviorSubject<boolean|undefined>(undefined);
  private readonly destroyed$ = new Subject<void>();

  readonly answer$ = combineLatest([ this.itemRoute$, this.isTask$, this.groupWatchingService.isWatching$ ]).pipe(
    /* we do the computation in 2 stages to prevent cancelling requests which shouldn't have been cancelled */
    map(([ route, isTask, isWatching ]): Strategy => {
      if (!route.answer) {
        if (isWatching) return { tag: 'EmptyInitialAnswer' };
        if (isTask === undefined) return { tag: 'Wait' };
        if (isTask) return route.attemptId ? { tag: 'LoadCurrent', itemId: route.id, attemptId: route.attemptId } : { tag: 'Wait' };
        else /* isTask === false */ return { tag: 'NotApplicable' };
      }
      if (route.answer.id) return { tag: 'LoadById', answerId: route.answer.id };
      return { tag: 'LoadBest', itemId: route.id, participantId: route.answer.participantId };
    }),
    distinctUntilChanged((s1, s2) => JSON.stringify(s1) === JSON.stringify(s2)),
    switchMap(strategy => {
      if (strategy.tag === 'EmptyInitialAnswer') return of(null);
      if (strategy.tag === 'LoadCurrent') return this.getCurrentAnswer(strategy.itemId, strategy.attemptId);
      if (strategy.tag === 'LoadById') return this.getAnswerService.get(strategy.answerId);
      if (strategy.tag === 'LoadBest') return this.getAnswerService.getBest(strategy.itemId, { watchedGroupId: strategy.participantId });
      // "Wait" and "NotApplicable" cases:
      return EMPTY;
    }),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  readonly error$ = this.answer$.pipe(
    switchMap(() => EMPTY), // ignore non-errors
    catchError(error => of(errorIsHTTPForbidden(error) ? loadForbiddenAnswerError : error))
  );
  readonly forbidden$ = this.error$.pipe(filter(error => error === loadForbiddenAnswerError));
  readonly unknownError$: Observable<unknown> = this.error$.pipe(filter(error => error !== loadForbiddenAnswerError));

  subscription = this.itemRoute$.pipe(
    map(route => route.id),
    distinctUntilChanged()
  ).subscribe(() => this.isTask$.next(undefined)); // each time the item change, reset 'isTask$'

  constructor(
    private groupWatchingService: GroupWatchingService,
    private currentAnswerService: CurrentAnswerService,
    private getAnswerService: GetAnswerService,
  ) {}

  setRoute(route: FullItemRoute): void {
    this.itemRoute$.next(route);
  }

  setIsTask(isTask: boolean|undefined): void {
    this.isTask$.next(isTask);
  }

  ngOnDestroy(): void {
    this.itemRoute$.complete();
    this.isTask$.complete();
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
