import { Injectable, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, scan, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { UserSessionService } from 'src/app/services/user-session.service';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { Item } from '../../data-access/get-item-by-id.service';
import { Result } from '../data-access/get-results.service';
import { FetchState } from 'src/app/utils/state';
import { Store } from '@ngrx/store';
import { fromItemContent } from '../store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

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
  private readonly scorePatch$ = new Subject<number | undefined>();
  private readonly maxScorePatch$ = this.scorePatch$.pipe(
    // Keep max score of all emitted scores. NB: adding operators to a subject makes it COLD.
    // Since it is cold, max score is ONLY computed for values emitted during the lifetime of the subscription
    scan<number | undefined, number | undefined>((max, score) => (score !== undefined ? Math.max(score, max ?? 0) : undefined), undefined),
    startWith(undefined),
    distinctUntilChanged(),
  );

  /* state to put outputted */
  readonly state$ = this.store.select(fromItemContent.selectActiveContentData).pipe(
    filter(isNotNull),
    // maxScorePatch is a cold observable, and switchMap operator acts a subscriber here
    // so the max score patch is only valid for current item
    switchMap(state => this.maxScorePatch$.pipe(map(score => this.patchScore(state, score)))),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  private subscription = combineLatest([
    this.userSessionService.userChanged$, // user change
    this.userSessionService.userProfile$.pipe(map(user => user.defaultLanguage), distinctUntilChanged()), // lang change
  ]).pipe(debounceTime(0)).subscribe(_s => this.refreshItem());

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
  ) {}

  refreshItem(): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
  }

  patchItemScore(score: number): void {
    this.scorePatch$.next(score);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyed$.next();
    this.destroyed$.complete();
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
