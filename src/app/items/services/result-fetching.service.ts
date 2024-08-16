import { Injectable } from '@angular/core';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { FullItemRoute, isRouteWithSelfAttempt } from 'src/app/models/routing/item-route';
import { GetResultsService, Result } from '../data-access/get-results.service';
import { EMPTY, Observable, map, of, switchMap } from 'rxjs';
import { canCurrentUserViewContent } from '../models/item-view-permission';
import { bestAttemptFromResults, implicitResultStart } from '../models/attempts';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';

export function canFetchResults(item: Item): boolean {
  return canCurrentUserViewContent(item);
}

@Injectable({
  providedIn: 'root'
})
export class ResultFetchingService {

  constructor(
    private resultsService: GetResultsService,
    private resultActionsService: ResultActionsService,
  ){}

  fetchResults(itemRoute: FullItemRoute, item: Item): Observable<{ results: Result[], currentResult?: Result }> {
    if (!canFetchResults(item)) return of({ results: [] });
    return this.resultsService.getResults(itemRoute).pipe(
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
          map(() => {
            const result = { attemptId, latestActivityAt: new Date(), startedAt: new Date(), score: 0, validated: false };
            return { results: [ ...results, result ], currentResult: result };
          })
        );
      }),
    );
  }

}
