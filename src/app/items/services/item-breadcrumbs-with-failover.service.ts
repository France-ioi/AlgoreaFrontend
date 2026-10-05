import { Injectable, inject } from '@angular/core';
import { BreadcrumbItem, GetBreadcrumbService } from '../data-access/get-breadcrumb.service';
import { FullItemRoute, isRouteWithSelfAttempt, itemRouteWith } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { Observable, Subject, catchError, concat, switchMap, tap } from 'rxjs';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { navigateReplacingItemRoute } from '../utils/item-route-validation';

function attemptChanged(original: FullItemRoute, recovered: FullItemRoute): boolean {
  return original.attemptId !== recovered.attemptId || original.parentAttemptId !== recovered.parentAttemptId;
}

@Injectable({
  providedIn: 'root'
})
export class ItemBreadcrumbsWithFailoverService {
  private breadcrumbService = inject(GetBreadcrumbService);
  private resultActionsService = inject(ResultActionsService);
  private itemRouter = inject(ItemRouter);

  private resultPathStarted = new Subject<void>();
  /** Indicate that we have started the full result path of the current item (was not started before doing it) */
  readonly resultPathStarted$ = this.resultPathStarted.asObservable();

  get(itemRoute: FullItemRoute): Observable<BreadcrumbItem[]> {
    return this.breadcrumbService.getBreadcrumb(itemRoute).pipe(
      /**
       * If the breadcrumb service fails with 'forbidden' error, try to start results for the item path. If this works, retry fetching
       * the breadcrumbs with the attempt returned by start-result-path. Otherwise, return the original breadcrumb error.
       * The inline retry is a fallback if navigation does not occur (e.g. a guard blocks). breadcrumbsFetchingEffect's switchMap
       * cancelling this inline retry after the replaceUrl update is expected.
       */
      catchError(err => {
        if (!errorIsHTTPForbidden(err)) throw err;
        const selfAttempt = isRouteWithSelfAttempt(itemRoute);
        const startPath = selfAttempt ? [ ...itemRoute.path, itemRoute.id ] : itemRoute.path;
        // Empty path would POST `/api/items//start-result-path` — skip failover for root items.
        if (startPath.length === 0) throw err;
        return this.resultActionsService.startWithoutAttempt(startPath).pipe(
          catchError(() => {
            throw err; // if `startWithoutAttempt` fails as well, do not retry and fail with the initial breadcrumb error
          }),
          tap(() => this.resultPathStarted.next()), // side effect: inform this operation has been done
          switchMap(attemptId => {
            const recovered = selfAttempt
              ? itemRouteWith(itemRoute, { attemptId, parentAttemptId: undefined })
              : itemRouteWith(itemRoute, { parentAttemptId: attemptId });
            const retry$ = this.breadcrumbService.getBreadcrumb(recovered);
            return attemptChanged(itemRoute, recovered)
              ? concat(navigateReplacingItemRoute(this.itemRouter, recovered), retry$)
              : retry$;
          }),
        );
      }),
    );
  }

}
