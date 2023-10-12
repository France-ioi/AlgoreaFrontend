import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, forkJoin, Observable, of, ReplaySubject, Subject, combineLatest } from 'rxjs';
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  map,
  retry,
  scan,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { bestAttemptFromResults, implicitResultStart } from 'src/app/models/attempts';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { BreadcrumbItem, GetBreadcrumbService } from '../data-access/get-breadcrumb.service';
import { GetItemByIdService, Item } from '../../data-access/get-item-by-id.service';
import { GetResultsService, Result } from '../data-access/get-results.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { buildUp } from 'src/app/utils/operators/build-up';
import { FetchState } from 'src/app/utils/state';
import { LocaleService } from 'src/app/services/localeService';
import { GroupWatchingService } from 'src/app/services/group-watching.service';
import { canCurrentUserViewContent } from 'src/app/models/item-view-permission';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';

export interface ItemData {
  route: FullItemRoute,
  item: Item,
  breadcrumbs: BreadcrumbItem[],
  results?: Result[],
  currentResult?: Result,
}

/**
 * A datasource which allows fetching a item using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class ItemDataSource implements OnDestroy {

  private readonly destroyed$ = new Subject<void>();
  private readonly fetchOperation$ = new ReplaySubject<FullItemRoute>(1); // trigger item fetching
  private readonly refresh$ = new Subject<void>();
  private readonly scorePatch$ = new Subject<number | undefined>();
  private readonly maxScorePatch$ = this.scorePatch$.pipe(
    // Keep max score of all emitted scores. NB: adding operators to a subject makes it COLD.
    // Since it is cold, max score is ONLY computed for values emitted during the lifetime of the subscription
    scan<number | undefined, number | undefined>((max, score) => (score !== undefined ? Math.max(score, max ?? 0) : undefined), undefined),
    startWith(undefined),
    distinctUntilChanged(),
  );

  private readonly profileLanguageMatchesAppLanguage$ = this.userSessionService.userProfile$.pipe(
    filter(profile => profile.defaultLanguage === this.localeService.currentLang?.tag),
  );

  /* state to put outputted */
  readonly state$ = combineLatest([
    this.fetchOperation$,
    this.groupWatchingService.watchedGroup$,
  ]).pipe(
    delayWhen(() => this.profileLanguageMatchesAppLanguage$),
    switchMap(([ item, watchedGroup ]) =>
      this.fetchItemData(item, watchedGroup?.route.id).pipe(mapToFetchState({ resetter: this.refresh$ }))
    ),
    // maxScorePatch is a cold observable, and switchMap operator acts a subscriber here
    // so the max score patch is only valid for current item
    switchMap(state => this.maxScorePatch$.pipe(map(score => this.patchScore(state, score)))),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );
  private resultPathStarted = new Subject<void>();
  /** Indicate that we have started the full result path of the current item (was not started before doing it) */
  readonly resultPathStarted$ = this.resultPathStarted.asObservable();

  private subscription = this.userSessionService.userChanged$.subscribe(_s => this.refreshItem());

  constructor(
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
    private getResultsService: GetResultsService,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private localeService: LocaleService,
  ) {}

  fetchItem(item: FullItemRoute): void {
    this.fetchOperation$.next(item);
  }

  refreshItem(): void {
    this.refresh$.next();
  }

  patchItemScore(score: number): void {
    this.scorePatch$.next(score);
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.fetchOperation$.complete();
    this.subscription.unsubscribe();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Observable of the item data fetching.
   * In parallel: breadcrumb and (in serial: get info and start result)
   */
  private fetchItemData(itemRoute: FullItemRoute, watchedGroupId?: string): Observable<ItemData> {
    return forkJoin({
      route: of(itemRoute),
      item: this.getItemByIdService.get(itemRoute.id, watchedGroupId),
      breadcrumbs: this.getBreadcrumb(itemRoute),
    }).pipe(
      buildUp(data => (canCurrentUserViewContent(data.item) ? this.fetchResults(data.route, data.item) : EMPTY)),
    );
  }

  private fetchResults(itemRoute: FullItemRoute, item: Item): Observable<{ results: Result[], currentResult?: Result }> {
    return this.getResultsService.getResults(itemRoute).pipe(
      switchMap(results => {
        // 1) if attempt_id was given as arg, try to select the matching result
        if (isRouteWithSelfAttempt(itemRoute)) {
          const currentResult = results.find(r => r.attemptId === itemRoute.attemptId);
          if (currentResult) return of({ results: results, currentResult: currentResult });
        }
        // 2) if there are already results on this item, select the best one
        const currentResult = bestAttemptFromResults(results);
        if (currentResult !== null) return of({ results: results, currentResult: currentResult });
        // 3) if no suitable one and this item does not allow implicit result start or perms are not sufficent, continue without result
        if (!implicitResultStart(item)) return of({ results: results });
        // 4) otherwise, start a result
        const attemptId = isRouteWithSelfAttempt(itemRoute) ? itemRoute.attemptId : itemRoute.parentAttemptId;
        if (!attemptId) return EMPTY; // unexpected
        return this.resultActionsService.start(itemRoute.path.concat([ itemRoute.id ]), attemptId).pipe(
          map(() => {
            const result = { attemptId, latestActivityAt: new Date(), startedAt: new Date(), score: 0, validated: false };
            return { results: [ ...results, result ], currentResult: result };
          })
        );
      }),
    );
  }

  private getBreadcrumb(itemRoute: FullItemRoute): Observable<BreadcrumbItem[]> {
    return this.getBreadcrumbService.getBreadcrumb(itemRoute).pipe(
      /**
       * If the breadcrumb service fails with 'forbidden' error, try to start results for the item path. If this works, retry fetching
       * the breadcrumbs. Otherwise, return the original breadcrumb error.
       */
      retry({
        count: 1,
        delay: (err: unknown) => {
          if (!errorIsHTTPForbidden(err)) throw err;
          const path = itemRoute.attemptId !== undefined ? [ ...itemRoute.path, itemRoute.id ] : itemRoute.path;
          return this.resultActionsService.startWithoutAttempt(path).pipe(
            tap(() => this.resultPathStarted.next()), // side effect: inform this operation has been done
            catchError(() => {
              throw err; // if `startWithoutAttempt` fails as well, do not retry and fail with the initial breadcrumb error
            })
          );
        }
      })
    );
  }

  private patchScore(state: FetchState<ItemData>, newScore?: number): FetchState<ItemData> {
    if (!state.data || newScore === undefined) return state;
    const score = Math.max(newScore ?? 0, state.data.currentResult?.score ?? 0);
    const bestScore = Math.max(state.data.item.bestScore, score);
    const validated = newScore >= 100 || !!state.data.currentResult?.validated;
    return {
      ...state,
      data: {
        ...state.data,
        item: { ...state.data.item, bestScore },
        currentResult: state.data.currentResult ? { ...state.data.currentResult, score, validated } : undefined,
      },
    };
  }

}
