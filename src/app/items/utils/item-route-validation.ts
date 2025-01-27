import { EMPTY, Observable, delay, map, of, switchMap } from 'rxjs';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { defaultAttemptId } from '../models/attempts';
import { loadAnswerAsCurrentFromBrowserState } from './load-answer-as-current-state';
import { ItemRouteError } from 'src/app/models/routing/item-route-serialization';

/**
 * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
 * Will redirect when relevant data has been fetched (and emit nothing).
 * May emit errors.
 */
export function solveMissingPathAttempt(
  { contentType, id, path, answer }: ItemRouteError,
  getItemPathService: GetItemPathService,
  resultActionsService: ResultActionsService,
  itemRouter: ItemRouter
): Observable<never> {
  return of(path).pipe(
    switchMap(path => (path ? of(path) : getItemPathService.getItemPath(id))),
    switchMap(path => {
      // for empty path (root items), consider the item has a (fake) parent attempt id 0
      if (path.length === 0) return of({ contentType, id, path, parentAttemptId: defaultAttemptId, answer });
      // else, will start all path but the current item
      return resultActionsService.startWithoutAttempt(path).pipe(
        map(attemptId => ({ contentType, id, path, parentAttemptId: attemptId, answer }))
      );
    }),
    delay(0), // required in order to trigger new navigation after the current one
    switchMap(itemRoute => {
      itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true }, loadAnswerIdAsCurrent: loadAnswerAsCurrentFromBrowserState() });
      return EMPTY;
    })
  );
}
