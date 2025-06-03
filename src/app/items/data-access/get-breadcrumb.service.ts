import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isRouteWithSelfAttempt, FullItemRoute } from 'src/app/models/routing/item-route';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { tagError } from 'src/app/utils/errors';
import { ensureDefined } from 'src/app/utils/assert';
import { itemTypeSchema, typeCategoryOfItem } from 'src/app/items/models/item-type';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

export const breadcrumbServiceTag = 'breadcrumbservice';

const breadcrumbsApiSchema = z.array(
  z.object({
    itemId: z.string(),
    languageTag: z.string(),
    title: z.string(),
    type: itemTypeSchema,
    attemptId: z.string().optional(), // set in all but the last one if parent_attempt_id param has been given
    attemptNumber: z.string().optional(), // set in all but the last one if parent_attempt_id param has been given
  })
);

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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getBreadcrumb(itemRoute: FullItemRoute): Observable<BreadcrumbItem[]> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemRoute.path.concat([ itemRoute.id ]).join('/')}/breadcrumbs`, {
        params: isRouteWithSelfAttempt(itemRoute) ? { attempt_id: itemRoute.attemptId } : { parent_attempt_id: itemRoute.parentAttemptId }
      })
      .pipe(
        decodeSnakeCase(breadcrumbsApiSchema),
        map(items => {
          const last = ensureDefined(items[items.length - 1]);

          // all but last are ensured to have attempt_id, treat the last one separetely
          return items.slice(0,-1).map((item, idx) => ({
            itemId: item.itemId,
            title: item.title,
            route: {
              id: item.itemId,
              path: items.slice(0,idx).map(it => it.itemId),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              attemptId: item.attemptId!, // the service ensures the attempt for all but last is given
              contentType: typeCategoryOfItem(item),
            } as FullItemRoute,
            attemptCnt: item.attemptNumber ? +item.attemptNumber : undefined,
          })).concat([{
            itemId: last.itemId,
            title: last.title,
            attemptCnt: last.attemptNumber ? +last.attemptNumber : undefined,
            route: itemRoute
          }]);
        }),
        catchError(err => {
          throw tagError(err, breadcrumbServiceTag);
        })
      );
  }

}
