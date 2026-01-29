import { Injectable, inject } from '@angular/core';
import { BreadcrumbItem, GetBreadcrumbService } from '../data-access/get-breadcrumb.service';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { Observable, Subject, catchError, retry, tap } from 'rxjs';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';

@Injectable({
  providedIn: 'root'
})
export class ItemBreadcrumbsWithFailoverService {
  private breadcrumbService = inject(GetBreadcrumbService);
  private resultActionsService = inject(ResultActionsService);

  private resultPathStarted = new Subject<void>();
  /** Indicate that we have started the full result path of the current item (was not started before doing it) */
  readonly resultPathStarted$ = this.resultPathStarted.asObservable();

  get(itemRoute: FullItemRoute): Observable<BreadcrumbItem[]> {
    return this.breadcrumbService.getBreadcrumb(itemRoute).pipe(
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

}
