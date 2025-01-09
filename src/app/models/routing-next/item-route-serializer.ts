import { UrlSegment } from '@angular/router';
import { ItemEntityRoute, ItemEntityWithParentAttemptRoute, ItemEntityWithPathRoute, ItemEntityWithSelfAttemptRoute } from './item-route';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { encodeItemRouteParameters, extractItemRouteParameters } from './item-route-url-parameters';
import { ItemId } from '../ids';

const activityPrefix = 'a';
const skillPrefix = 's';

export function deserializeItemRoute(segments: UrlSegment[]): ItemEntityRoute|null {
  const [ prefixSegment, mainSegment, ...pageSegments ] = segments;

  if (!prefixSegment || !mainSegment) return null;

  let category: ItemTypeCategory;
  if (prefixSegment.path === activityPrefix) category = 'activity';
  else if (prefixSegment.path === skillPrefix) category = 'skill';
  else return null;

  const id = mainSegment.path;
  if (!id) return null;

  const parameters = extractItemRouteParameters(mainSegment.parameters);
  const { path, attemptId, parentAttemptId } = parameters;

  const answer = parameters.answerId ?
    { id: parameters.answerId } :
    (parameters.answerBest ? { best: { id: parameters.answerBestParticipantId } } : undefined);

  const base = { category, id, page: pageSegments.map(seg => seg.path), answer };

  if (path) {
    if (attemptId) return new ItemEntityWithSelfAttemptRoute({ ...base, path, attemptId });
    if (parentAttemptId) return new ItemEntityWithParentAttemptRoute({ ...base, path, parentAttemptId });
    return new ItemEntityWithPathRoute({ ...base, path });
  }
  return new ItemEntityRoute(base);
}

export function serializeItemRoute(
  category: ItemTypeCategory,
  id: ItemId,
  parameters: Parameters<typeof encodeItemRouteParameters>[0],
  page?: string[]
): UrlSegment[] {
  return [
    new UrlSegment(category === 'activity' ? activityPrefix : skillPrefix, {}),
    new UrlSegment(id, encodeItemRouteParameters(parameters)),
    ...(page ?? []).map(p => new UrlSegment(p, {})),
  ];
}

