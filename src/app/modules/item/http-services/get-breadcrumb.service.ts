import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map, catchError } from 'rxjs/operators';

interface RawBreadcrumbItem {
  item_id: string,
  title: string,
  language_tag: string,
  attempt_id?: string,
  attempt_number?: string,
}

export interface BreadcrumbItem {
  itemId: string,
  title: string
  attemptId?: string,
  attemptCnt?: number,
}

@Injectable({
  providedIn: 'root'
})
export class GetBreadcrumbService {

  constructor(private http: HttpClient) {}

  getBreadcrumb(itemIdPath: string[], attemptId: string): Observable<BreadcrumbItem[]|'forbidden'> {
    return this.getBreadcrumbGeneric(itemIdPath, { attempt_id: attemptId });
  }

  getBreadcrumbWithParentAttempt(itemIdPath: string[], parentAttemptId: string): Observable<BreadcrumbItem[]|'forbidden'> {
      return this.getBreadcrumbGeneric(itemIdPath, { parent_attempt_id: parentAttemptId });
  }

  private getBreadcrumbGeneric(itemIdPath: string[], parameters: {[param: string]: string}): Observable<BreadcrumbItem[]|'forbidden'> {
    return this.http
      .get<RawBreadcrumbItem[]>(`${environment.apiUrl}/items/${itemIdPath.join('/')}/breadcrumbs`, {
        params: parameters
      })
      .pipe(
        map((items) => {
          return items.map((item) => ({
            itemId: item.item_id,
            title: item.title,
            attemptId: item.attempt_id,
            attemptCnt: item.attempt_number ? +item.attempt_number : undefined,
          }));
        }),
        // extract one specific kind of error (403) as this one needs to be handled separately
        catchError((err) => {
          if (err instanceof HttpErrorResponse && err.status === 403) {
            return of<'forbidden'>('forbidden');
          }
          throw err;
        })

      );
  }

}
