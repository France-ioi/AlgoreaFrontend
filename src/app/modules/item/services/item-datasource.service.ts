import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, concat, EMPTY, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, mapTo, switchMap, tap } from 'rxjs/operators';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { NavItem } from 'src/app/shared/services/nav-types';
import { canCurrentUserViewItemContent } from '../helpers/item-permissions';
import { BreadcrumbItem, GetBreadcrumbService } from '../http-services/get-breadcrumb.service';
import { GetItemByIdService, Item } from '../http-services/get-item-by-id.service';

export interface ItemData { item: Item, breadcrumbs: BreadcrumbItem[], attemptId: string|null }

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
  item$ = this.state.pipe( // only fetched items, to be use in template as it cannot properly infer types
    filter<Ready<ItemData>|Fetching|FetchError, Ready<ItemData>>(isReady),
    map(s => s.data.item)
  )

  private fetchOperation = new Subject<NavItem>(); // trigger item fetching

  constructor(
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
  ) {
    // Do fetch on the "fetching" state so that only the latest fetching request is considered (using switchMap)
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
  }

  /**
   * Observable of the item data fetching.
   * In parallel: breadcrumb and (in serial: get info and start result)
   */
  private fetchItemData(navItem: NavItem): Observable<ItemData> {
    return forkJoin([
      this.getBreadcrumb(navItem),
      this.getItemByIdService.get(navItem.itemId).pipe(
        switchMap((item) => this.startResultIfNeeded(navItem, item).pipe(map(a => ({ item: item, attemptId: a }))))
      )
    ]).pipe(
      map(([breadcrumbs, {item: i, attemptId: a}]) => ({ item: i, breadcrumbs: breadcrumbs, attemptId: a })),
    );
  }

  private startResultIfNeeded(navItem: NavItem, item: Item): Observable<string|null> { // observable of the result attempt_id
    const attemptId  = navItem.attemptId || navItem.parentAttemptId;
    // if not allowed to start a result on this attempt, do not try
    if (item.requires_explicit_entry || !canCurrentUserViewItemContent(item) || !attemptId) return of(null);
    return this.resultActionsService.start(navItem.itemPath.concat([navItem.itemId]), attemptId).pipe(
      mapTo(attemptId),
      catchError(_e => of(null)) // if got an error, continue with no result
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
    const fullPath = navItem.itemPath.concat([navItem.itemId]);
    if (navItem.attemptId) return this.getBreadcrumbService.getBreadcrumb(fullPath, navItem.attemptId);
    else if (navItem.parentAttemptId) return this.getBreadcrumbService.getBreadcrumbWithParentAttempt(fullPath, navItem.parentAttemptId);
    else return undefined;
  }

}
