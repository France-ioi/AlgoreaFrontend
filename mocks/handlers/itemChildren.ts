import '../middlewares/operation';
import { Router } from 'express';
import { definitions, NullableValues } from '../types';
import { children1012286565380301759 } from '../dataset/items/1012286565380301759_children';

const router = Router();

type ChildItem = NullableValues<definitions['childItem']>;

export const childrenByItemId: Record<string, ChildItem[]> = {
  '1012286565380301759': children1012286565380301759,
};

function canViewContent(child: ChildItem): boolean {
  const canView = child.permissions?.can_view;
  return canView !== undefined && canView !== 'none' && canView !== 'info';
}

function hasStartedResult(child: ChildItem): boolean {
  return Array.isArray(child.results) && child.results.some(result => result?.started_at != null);
}

/** Sample L2 children for the mock: siblings without further nesting. */
function sampleLevel2Children(allVisible: ChildItem[], currentId: string | null | undefined): ChildItem[] {
  return allVisible
    .filter(child => child.id !== currentId)
    .slice(0, 2)
    .map(({ ...child }) => child);
}

router.get('/api/items/:itemId/children', (req, res, next) => {
  const children = childrenByItemId[req.params.itemId];
  if (!children) return next();

  const visible = req.query.show_invisible_items === '1'
    ? children
    : children.filter(child => child.permissions.can_view !== 'none');

  // Presence of show_level2_children (any value) enables nested children on eligible L1 items.
  // Nested `children` is not yet on the generated OpenAPI childItem type; cast for the mock payload.
  const showLevel2 = req.query.show_level2_children !== undefined;
  const includeDescription = req.query.include_description !== undefined;
  let payload: ChildItem[] = showLevel2
    ? visible.map(child => {
      if (!canViewContent(child) || !hasStartedResult(child)) {
        return child;
      }
      return { ...child, children: sampleLevel2Children(visible, child.id) };
    })
    : visible;

  if (includeDescription) {
    payload = payload.map(child => {
      if (!canViewContent(child) || !child.string) {
        return child;
      }
      return {
        ...child,
        string: {
          ...child.string,
          description: child.string.subtitle ?? null,
        },
      };
    });
  }

  res
    .operation('/items/{item_id}/children', 'get')
    .status(200)
    .send(payload as ChildItem[]);
  next();
});

export default router;
