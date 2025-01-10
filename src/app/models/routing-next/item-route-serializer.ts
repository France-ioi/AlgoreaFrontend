import { UrlSegment } from '@angular/router';
import { ItemRouteParameters, ItemEntityRoute, createItemEntity } from './item-route';
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
  const page = pageSegments.map(seg => seg.path);
  return createItemEntity(category, id, parameters, page);
}

export function serializeItemRoute(
  category: ItemTypeCategory,
  id: ItemId,
  parameters: ItemRouteParameters,
  page?: string[]
): UrlSegment[] {
  return [
    new UrlSegment(category === 'activity' ? activityPrefix : skillPrefix, {}),
    new UrlSegment(id, encodeItemRouteParameters(parameters)),
    ...(page ?? []).map(p => new UrlSegment(p, {})),
  ];
}

