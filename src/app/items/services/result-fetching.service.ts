import { Injectable, inject } from '@angular/core';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { GetResultsService } from '../data-access/get-results.service';
import { Observable, of } from 'rxjs';
import { canCurrentUserViewInfo } from '../models/item-view-permission';
import { Result } from '../models/attempts';

export function canFetchResults(item: Item): boolean {
  return canCurrentUserViewInfo(item);
}

@Injectable({
  providedIn: 'root'
})
export class ResultFetchingService {
  private resultsService = inject(GetResultsService);

  /**
   * Fetches the attempts list for the given item route (permission gate only).
   * Attempt selection / implicit start live in `selectAttemptResolution` + `ensureAttemptInUrlEffect`.
   */
  fetchResults(itemRoute: FullItemRoute, item: Item): Observable<Result[]> {
    if (!canFetchResults(item)) return of([]);
    return this.resultsService.getResults(itemRoute);
  }

}
