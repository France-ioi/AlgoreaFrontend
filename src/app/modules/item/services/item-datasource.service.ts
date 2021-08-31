import { Injectable, OnDestroy } from '@angular/core';
import { concat, EMPTY, forkJoin, merge, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { bestAttemptFromResults, implicitResultStart } from 'src/app/shared/helpers/attempts';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { BreadcrumbItem, GetBreadcrumbService } from '../http-services/get-breadcrumb.service';
import { GetItemByIdService, Item } from '../http-services/get-item-by-id.service';
import { GetResultsService, Result } from '../http-services/get-results.service';
import { canCurrentUserViewItemContent } from 'src/app/modules/item/helpers/item-permissions';
import { mapToFetchState } from 'src/app/shared/operators/state';

export interface ItemData { route: FullItemRoute, item: Item, breadcrumbs: BreadcrumbItem[], results?: Result[], currentResult?: Result}

/**
 * A datasource which allows fetching a item using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class ItemDataSource implements OnDestroy {

  private readonly fetchOperation$ = new ReplaySubject<FullItemRoute>(1); // trigger item fetching
  private readonly refresh$ = new Subject<void>();

  /* state to put outputted */
  readonly state$ = this.fetchOperation$.pipe(
    switchMap(item => this.fetchItemData(item)),
    mapToFetchState({ resetter: merge(this.refresh$, this.fetchOperation$) })
  );

  private subscription: Subscription;

  constructor(
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
    private getResultsService: GetResultsService,
    private userSessionService: UserSessionService,
  ) {
    this.subscription = this.userSessionService.userChanged$.subscribe(_s => this.refreshItem());
  }

  fetchItem(item: FullItemRoute): void {
    this.fetchOperation$.next(item);
  }

  refreshItem(): void {
    this.refresh$.next();
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.fetchOperation$.complete();
    this.subscription.unsubscribe();
  }

  /**
   * Observable of the item data fetching.
   * In parallel: breadcrumb and (in serial: get info and start result)
   */
  private fetchItemData(itemRoute: FullItemRoute): Observable<ItemData> {
    return forkJoin([
      this.getBreadcrumbService.getBreadcrumb(itemRoute),
      this.getItemByIdService.get(itemRoute.id)
    ]).pipe(
      switchMap(([ breadcrumbs, item ]) => {
        // emit immediately without results, then, if the perm allows it, fetch results
        const initialData = { route: itemRoute, item: item, breadcrumbs: breadcrumbs };
        if (canCurrentUserViewItemContent(item)) {
          return concat(
            of(initialData),
            this.fetchResults(itemRoute, item).pipe(
              map(r => ({ ...initialData, ...r }))
            )
          );
        } else return of(initialData);
      })
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

}
