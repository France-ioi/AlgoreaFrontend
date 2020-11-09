import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, concat, EMPTY, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { bestAttemptFromResults, implicitResultStart } from 'src/app/shared/helpers/attempts';
import { isRouteWithAttempt, ItemRoute, incompleteItemUrl } from 'src/app/shared/helpers/item-route';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { BreadcrumbItem, GetBreadcrumbService } from '../http-services/get-breadcrumb.service';
import { GetItemByIdService, Item } from '../http-services/get-item-by-id.service';
import { GetResultsService, Result } from '../http-services/get-results.service';

export interface ItemData { route: ItemRoute, item: Item, breadcrumbs: BreadcrumbItem[], results?: Result[], currentResult?: Result}

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

  private fetchOperation = new Subject<ItemRoute>(); // trigger item fetching

  constructor(
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
    private getResultsService: GetResultsService,
    private router: Router,
  ) {
    this.fetchOperation.pipe(

      // switchMap does cancel the previous ongoing processing if a new one comes
      // on new fetch operation to be done: set "fetching" stae and fetch the data which will result in a ready or error state
      switchMap(item =>
        concat(
          of(fetchingState()),
          this.fetchItemData(item).pipe(
            map(res => readyState(res)),
            catchError(e => of(errorState(e)))
          )
        )
      ),

    ).subscribe(state => this.state.next(state));
  }

  fetchItem(item: ItemRoute): void {
    this.fetchOperation.next(item);
  }

  refreshItem(): void {
    if (isReady(this.state.value)) {
      this.fetchItem(this.state.value.data.route);
    }
  }

  ngOnDestroy(): void {
    this.state.complete();
    this.fetchOperation.complete();
  }

  /**
   * Observable of the item data fetching.
   * In parallel: breadcrumb and (in serial: get info and start result)
   */
  private fetchItemData(itemRoute: ItemRoute): Observable<ItemData> {
    return forkJoin([
      this.getBreadcrumb(itemRoute),
      this.getItemByIdService.get(itemRoute.id)
    ]).pipe(
      switchMap(([ breadcrumbs, item ]) => {
        // emit immediately without result, then fetch and add it
        const initialData = { route: itemRoute, item: item, breadcrumbs: breadcrumbs };
        return concat(
          of(initialData),
          this.fetchResults(itemRoute, item).pipe(
            map(r => ({ ...initialData, ...r }))
          )
        );
      })
    );
  }

  private fetchResults(itemRoute: ItemRoute, item: Item): Observable<{ results: Result[], currentResult?: Result }> {
    return this.getResultsService.getResults(itemRoute).pipe(
      switchMap(results => {
        // 1) if attempt_id was given as arg, try to select the matching result
        if (isRouteWithAttempt(itemRoute)) {
          const currentResult = results.find(r => r.attemptId === itemRoute.attemptId);
          if (currentResult) return of({ results: results, currentResult: currentResult });
        }
        // 2) if there are already results on this item, select the best one
        const currentResult = bestAttemptFromResults(results);
        if (currentResult !== null) return of({ results: results, currentResult: currentResult });
        // 3) if no suitable one and this item does not allow implicit result start or perms are not sufficent, continue without result
        if (!implicitResultStart(item)) return of({ results: results });
        // 4) otherwise, start a result
        const attemptId = isRouteWithAttempt(itemRoute) ? itemRoute.attemptId : itemRoute.parentAttemptId;
        if (!attemptId) return EMPTY; // unexpected
        return this.resultActionsService.start(itemRoute.path.concat([ itemRoute.id ]), attemptId).pipe(
          // once a result has been created, fetch it
          switchMap(() => this.getResultsService.getResults(itemRoute).pipe(
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

  private getBreadcrumb(item: ItemRoute): Observable<BreadcrumbItem[]> {
    const service = this.getBreadcrumbService.getBreadcrumb(item);
    if (!service) return EMPTY; // unexpected as it should verified by the caller of this function
    return service.pipe(
      map(res => {
        if (res === 'forbidden') {
          // clear the route & attempt and retry to visit this item (path/attempt discovery will be called)
          // ideally routing should not be called inside the datasource and maximum number of tries should be allowed
          void this.router.navigate(incompleteItemUrl(item.id));
          throw new Error('unhandled forbidden');
        } else {
          return res;
        }
      }),
    );
  }

}
