import { ParamMap } from '@angular/router';
import { ItemTypeCategory } from 'src/app/models/item-type';
import { decodeItemRouterParameters, FullItemRoute, itemCategoryFromPrefix, ItemRoute } from 'src/app/models/routing/item-route';

interface ItemRouteError extends Partial<ItemRoute> {
  tag: 'error',
  contentType: ItemTypeCategory,
}

export function itemRouteFromParams(prefix: string, params: ParamMap): FullItemRoute|ItemRouteError {
  const contentType = itemCategoryFromPrefix(prefix);
  if (contentType === null) throw new Error('Unexpected item path prefix');
  const { id, path, attemptId, parentAttemptId, answerId, answerBest, answerParticipantId, answerLoadAsCurrent }
    = decodeItemRouterParameters(params);
  let answer: ItemRoute['answer']|undefined;
  if (answerBest) answer = { best: true, participantId: answerParticipantId ?? undefined };
  else if (answerId) answer = { id: answerId, loadAsCurrent: answerLoadAsCurrent ? true : undefined };

  if (!id) return { tag: 'error', contentType };
  if (path === null) return { tag: 'error', contentType, id, answer };
  if (attemptId) return { contentType, id: id, path, attemptId, answer };
  if (parentAttemptId) return { contentType, id, path, parentAttemptId, answer };
  return { tag: 'error', contentType, id, path, answer };
}

export function isItemRouteError(route: FullItemRoute|ItemRouteError): route is ItemRouteError {
  return 'tag' in route && route.tag === 'error';
}
