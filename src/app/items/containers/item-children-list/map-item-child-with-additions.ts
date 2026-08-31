import { ItemChildren } from '../../../data-access/get-item-children.service';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { ItemChildWithAdditions } from './item-children';

/** Top-level child or single-level-deep nested leaf from `GET /items/{id}/children`. */
export type MappableItemChild =
  ItemChildren[number] | NonNullable<ItemChildren[number]['children']>[number];

export function mapChildWithAdditions(child: MappableItemChild): ItemChildWithAdditions {
  const res = bestAttemptFromResults(child.results);
  const nested = 'children' in child ? child.children : undefined;
  return {
    ...child,
    isLocked: !canCurrentUserViewContent(child),
    result: res === null ? undefined : {
      attemptId: res.attemptId,
      validated: res.validated,
      score: res.scoreComputed,
    },
    children: nested?.map(mapChildWithAdditions),
  };
}
