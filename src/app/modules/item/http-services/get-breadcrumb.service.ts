import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { isRouteWithAttempt, ItemRoute } from 'src/app/shared/helpers/item-route';
import { appConfig } from 'src/app/shared/helpers/config';

interface RawBreadcrumbItem {
  item_id: string,
  title: string,
  language_tag: string,
  attempt_id?: string, // set in all but the last one if parent_attempt_id param has been given
  attempt_number?: string, //  set in all but the last one if parent_attempt_id param has been given
}

export interface BreadcrumbItem {
  itemId: string,
  title: string
  route: ItemRoute
  attemptCnt?: number,
}

@Injectable({
  providedIn: 'root'
})
export class GetBreadcrumbService {

  constructor(private http: HttpClient) {}

   getBreadcrumb(itemRoute: ItemRoute): Observable<BreadcrumbItem[]|'forbidden'> {
    return this.http
      .get<RawBreadcrumbItem[]>(`${appConfig().apiUrl}/items/${itemRoute.path.concat([ itemRoute.id ]).join('/')}/breadcrumbs`, {
        params: isRouteWithAttempt(itemRoute) ? { attempt_id: itemRoute.attemptId } : { parent_attempt_id: itemRoute.parentAttemptId }
      })
      .pipe(
        map(items => {
          const last = items[items.length - 1];
          // all but last are ensured to have attempt_id, treat the last one separetely
          return items.slice(0,-1).map((item, idx) => ({
            itemId: item.item_id,
            title: item.title,
            route: {
              id: item.item_id,
              path: items.slice(0,idx).map(it => it.item_id),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              attemptId: item.attempt_id!, // the service ensures the attempt for all but last is given
            } as ItemRoute,
            attemptCnt: item.attempt_number ? +item.attempt_number : undefined,
          })).concat([{
            itemId: last.item_id,
            title: last.title,
            attemptCnt: last.attempt_number ? +last.attempt_number : undefined,
            route: itemRoute
          }]);
        }),
        // extract one specific kind of error (403) as this one needs to be handled separately
        catchError(err => {
          if (err instanceof HttpErrorResponse && err.status === 403) {
            return of<'forbidden'>('forbidden');
          }
          throw err;
        })

      );
  }

}
