import { EMPTY, Observable, delay, map, of, switchMap, throwError } from 'rxjs';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { defaultAttemptId } from '../models/attempts';
import { loadAnswerAsCurrentFromBrowserState } from './load-answer-as-current-state';
import { ItemRouteError } from 'src/app/models/routing/item-route-serialization';

class NoSuchAliasError extends Error {
  constructor() {
    super('The given alias could not be resolved to an item id');
    this.name = 'NoSuchAliasError';
  }
}

/**
 * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
 * Will redirect when relevant data has been fetched (and emit nothing).
 * May emit errors.
 */
export function solveRouteError(
  { contentType, id, path, answer, observedGroup }: ItemRouteError,
  getItemPathService: GetItemPathService,
  resultActionsService: ResultActionsService,
  itemRouter: ItemRouter
): Observable<never> {
  if (!id) return throwError(() => new NoSuchAliasError());
  return of(path).pipe(
    switchMap(path => (path ? of(path) : getItemPathService.getItemPath(id))),
    switchMap(path => {
      // for empty path (root items), consider the item has a (fake) parent attempt id 0
      if (path.length === 0) return of({ contentType, id, path, parentAttemptId: defaultAttemptId, answer, observedGroup });
      // else, will start all path but the current item
      return resultActionsService.startWithoutAttempt(path).pipe(
        map(attemptId => ({ contentType, id, path, parentAttemptId: attemptId, answer, observedGroup }))
      );
    }),
    delay(0), // required in order to trigger new navigation after the current one
    switchMap(itemRoute => {
      itemRouter.navigateTo(itemRoute, {
        navExtras: { replaceUrl: true },
        loadAnswerIdAsCurrent: loadAnswerAsCurrentFromBrowserState(),
        useCurrentObservation: true
      });
      return EMPTY;
    })
  );
}
