import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/shared/routing/item-route';
import { appConfig } from 'src/app/shared/helpers/config';
import { tagError } from 'src/app/shared/helpers/errors';
import { ensureDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ItemType, typeCategoryOfItem } from '../../../shared/helpers/item-type';

export const breadcrumbServiceTag = 'breadcrumbservice';

interface RawBreadcrumbItem {
  item_id: string,
  title: string,
  language_tag: string,
  attempt_id?: string, // set in all but the last one if parent_attempt_id param has been given
  attempt_number?: string, //  set in all but the last one if parent_attempt_id param has been given
  type: ItemType,
}

export interface BreadcrumbItem {
  itemId: string,
  title: string,
  route: FullItemRoute,
  attemptCnt?: number,
}

@Injectable({
  providedIn: 'root'
})
export class GetBreadcrumbService {

  constructor(private http: HttpClient) {}

  getBreadcrumb(itemRoute: FullItemRoute): Observable<BreadcrumbItem[]> {
    return this.http
      .get<RawBreadcrumbItem[]>(`${appConfig.apiUrl}/items/${itemRoute.path.concat([ itemRoute.id ]).join('/')}/breadcrumbs`, {
        params: isRouteWithSelfAttempt(itemRoute) ? { attempt_id: itemRoute.attemptId } : { parent_attempt_id: itemRoute.parentAttemptId }
      })
      .pipe(
        map(items => {
          const last = ensureDefined(items[items.length - 1]);

          // all but last are ensured to have attempt_id, treat the last one separetely
          return items.slice(0,-1).map((item, idx) => ({
            itemId: item.item_id,
            title: item.title,
            route: {
              id: item.item_id,
              path: items.slice(0,idx).map(it => it.item_id),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              attemptId: item.attempt_id!, // the service ensures the attempt for all but last is given
              contentType: typeCategoryOfItem(item),
            } as FullItemRoute,
            attemptCnt: item.attempt_number ? +item.attempt_number : undefined,
          })).concat([{
            itemId: last.item_id,
            title: last.title,
            attemptCnt: last.attempt_number ? +last.attempt_number : undefined,
            route: itemRoute
          }]);
        }),
        catchError(err => {
          throw tagError(err, breadcrumbServiceTag);
        })
      );
  }

}
