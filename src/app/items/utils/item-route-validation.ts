import { ParamMap } from '@angular/router';
import { EMPTY, Observable, map, of, switchMap } from 'rxjs';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { decodeItemRouterParameters, FullItemRoute, ItemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { defaultAttemptId } from '../models/attempts';
import { ItemTypeCategory } from '../models/item-type';

export type ItemRouteError = { tag: 'error' } & Pick<ItemRoute, 'id'|'contentType'> & Partial<ItemRoute>;

export function itemRouteFromParams(contentType: ItemTypeCategory, params: ParamMap): FullItemRoute|ItemRouteError {
  const { id, path, attemptId, parentAttemptId, answerId, answerBest, answerParticipantId, answerLoadAsCurrent }
    = decodeItemRouterParameters(params);
  let answer: ItemRoute['answer']|undefined;
  if (answerBest) answer = { best: true, participantId: answerParticipantId ?? undefined };
  else if (answerId) answer = { id: answerId, loadAsCurrent: answerLoadAsCurrent ? true : undefined };

  if (!id) throw new Error('Unexpected missing id from item param');
  if (path === null) return { tag: 'error', contentType, id, answer };
  if (attemptId) return { contentType, id: id, path, attemptId, answer };
  if (parentAttemptId) return { contentType, id, path, parentAttemptId, answer };
  return { tag: 'error', contentType, id, path, answer };
}

export function isItemRouteError(route: FullItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}

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
    switchMap(itemRoute => {
      itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
      return EMPTY;
    })
  );
}
