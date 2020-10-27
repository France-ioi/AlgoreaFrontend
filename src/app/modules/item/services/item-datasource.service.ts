import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, concat, EMPTY, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { bestAttemptFromResults, implicitResultStart } from 'src/app/shared/helpers/attempts';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { NavItem } from 'src/app/shared/services/nav-types';
import { BreadcrumbItem, GetBreadcrumbService } from '../http-services/get-breadcrumb.service';
import { GetItemByIdService, Item } from '../http-services/get-item-by-id.service';
import { GetResultsService, Result } from '../http-services/get-results.service';

export interface ItemData { nav: NavItem, item: Item, breadcrumbs: BreadcrumbItem[], results?: Result[], currentResult?: Result}

/**
 * A datasource which allows fetching a item using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class ItemDataSource implements OnDestroy {

  /* state to put outputted */
  private state = new BehaviorSubject<Ready<ItemData>|Fetching|FetchError>(fetchingState());
  state$ = this.state.asObservable();
  itemData$ = this.state.pipe( // only fetched items, to be use in template as it cannot properly infer types
    filter<Ready<ItemData>|Fetching|FetchError, Ready<ItemData>>(isReady),
    map(s => s.data)
  );
  item$ = this.itemData$.pipe(map(s => s.item));

  private fetchOperation = new Subject<NavItem>(); // trigger item fetching

  constructor(
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
    private getResultsService: GetResultsService,
  ) {
    this.fetchOperation.pipe(

      // switchMap does cancel the previous ongoing processing if a new one comes
      switchMap(navItem => {
        const dataFetch = this.fetchItemData(navItem).pipe(
          map(res => readyState(res)),
          catchError(e => of(errorState(e)))
        );
        // if the fetched item is the same as the current one, do not change state to "loading" (silent refresh)
        const currentState = this.state.value;
        if (isReady(currentState) && currentState.data.item.id === navItem.itemId) return dataFetch;
        else return concat(of(fetchingState()), dataFetch);
      }),

    ).subscribe(state => this.state.next(state));
  }

  fetchItem(navItem: NavItem) {
    this.fetchOperation.next(navItem);
  }

  ngOnDestroy() {
    this.state.complete();
    this.fetchOperation.complete();
  }

  /**
   * Observable of the item data fetching.
   * In parallel: breadcrumb and (in serial: get info and start result)
   */
  private fetchItemData(navItem: NavItem): Observable<ItemData> {
    return forkJoin([
      this.getBreadcrumb(navItem),
      this.getItemByIdService.get(navItem.itemId)
    ]).pipe(
      switchMap(([ breadcrumbs, item ]) => {
        // emit immediately without result, then fetch and add it
        const initialData = { nav: navItem, item: item, breadcrumbs: breadcrumbs };
        return concat(
          of(initialData),
          this.fetchResults(navItem, item).pipe(
            map(r => ({ ...initialData, ...r }))
          )
        );
      })
    );
  }

  private fetchResults(nav: NavItem, item: Item): Observable<{ results: Result[], currentResult?: Result }> {
    let attempt: { attemptId: string } | { parentAttemptId: string };
    if (nav.parentAttemptId) attempt = { parentAttemptId: nav.parentAttemptId };
    else if (nav.attemptId) attempt = { attemptId: nav.attemptId };
    else return EMPTY; // unexpected

    return this.getResultsService.getResults(nav.itemId, attempt).pipe(
      switchMap(results => {
        // 1) if attempt_id was given as arg, try to select the matching result
        if (nav.attemptId) {
          const currentResult = results.find(r => r.attemptId === nav.attemptId);
          if (currentResult) return of({ results: results, currentResult: currentResult });
        }
        // 2) if there are already results on this item, select the best one
        const currentResult = bestAttemptFromResults(results);
        if (currentResult !== null) return of({ results: results, currentResult: currentResult });
        // 3) if no suitable one and this item does not allow implicit result start or perms are not sufficent, continue without result
        if (!implicitResultStart(item)) return of({ results: results });
        // 4) otherwise, start a result
        const attemptId  = nav.attemptId || nav.parentAttemptId;
        if (!attemptId) return EMPTY; // unexpected
        return this.resultActionsService.start(nav.itemPath.concat([ nav.itemId ]), attemptId).pipe(
          // once a result has been created, fetch it
          switchMap(() => this.getResultsService.getResults(nav.itemId, attempt).pipe(
            map(results => {
              // this time we are sure to have a started result as we just started it
              const currentResult = bestAttemptFromResults(results);
              if (currentResult === null) throw new Error('Unexpected: result just created not found');
              return { results: results, currentResult: currentResult };
            }),
          )),
        );
      }),
    );
  }

  private getBreadcrumb(navItem: NavItem): Observable<BreadcrumbItem[]> {
    const service = this.breadcrumbService(navItem);
    if (!service) return EMPTY; // unexpected as it should verified by the caller of this function
    return service.pipe(
      // transform forbidden in error while we do not handle it correctly
      tap(res => {
        if (res === 'forbidden') throw new Error('unhandled forbidden');
      }),
      filter<BreadcrumbItem[]|'forbidden',BreadcrumbItem[]>((_res): _res is BreadcrumbItem[] => true)
    );
  }

  /**
   * Return the observable to the suitable breadcrumb service depending on the navitem, or undefined if no attempt is given.
   */
  private breadcrumbService(navItem: NavItem): Observable<BreadcrumbItem[]|'forbidden'>|undefined {
    const fullPath = navItem.itemPath.concat([ navItem.itemId ]);
    if (navItem.attemptId) return this.getBreadcrumbService.getBreadcrumb(fullPath, navItem.attemptId);
    else if (navItem.parentAttemptId) return this.getBreadcrumbService.getBreadcrumbWithParentAttempt(fullPath, navItem.parentAttemptId);
    else return undefined;
  }

}
