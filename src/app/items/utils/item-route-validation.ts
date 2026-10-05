import { EMPTY, Observable, concat, delay, of, switchMap, throwError } from 'rxjs';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { defaultAttemptId } from '../models/attempts';
import { loadAnswerAsCurrentFromNavigationState } from 'src/app/models/routing/item-navigation-state';
import { ItemRouteError } from 'src/app/models/routing/item-route-serialization';
import { ItemPath } from 'src/app/models/ids';
import { RawItemRoute } from 'src/app/models/routing/item-route';

export const NO_SUCH_ALIAS_ERROR_NAME = 'NoSuchAliasError';

class NoSuchAliasError extends Error {
  constructor() {
    super('The given alias could not be resolved to an item id');
    this.name = NO_SUCH_ALIAS_ERROR_NAME;
  }
}

/**
 * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
 * Will redirect when relevant data has been fetched. Emits the started path once after a successful start-result-path
 * (root items have an empty path and emit nothing). May emit errors.
 */
export function solveRouteError(
  { contentType, id, path, answer, observedGroup }: ItemRouteError,
  getItemPathService: GetItemPathService,
  resultActionsService: ResultActionsService,
  itemRouter: ItemRouter
): Observable<ItemPath> {
  if (!id) return throwError(() => new NoSuchAliasError());
  const navigate = (itemRoute: RawItemRoute): Observable<never> => of(itemRoute).pipe(
    delay(0), // required in order to trigger new navigation after the current one
    switchMap(itemRoute => {
      const loadAnswerIdAsCurrent = loadAnswerAsCurrentFromNavigationState();
      itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true }, loadAnswerIdAsCurrent, useCurrentObservation: true });
      return EMPTY;
    }),
  );
  return of(path).pipe(
    switchMap(path => (path ? of(path) : getItemPathService.getItemPath(id))),
    switchMap(path => {
      // for empty path (root items), consider the item has a (fake) parent attempt id 0
      if (path.length === 0) return navigate({ contentType, id, path, parentAttemptId: defaultAttemptId, answer, observedGroup });
      // else, will start all path but the current item
      return resultActionsService.startWithoutAttempt(path).pipe(
        switchMap(attemptId => concat(
          of(path),
          navigate({ contentType, id, path, parentAttemptId: attemptId, answer, observedGroup }),
        )),
      );
    }),
  );
}
