import '../middlewares/operation';
import { Router } from 'express';
import { definitions, NullableValues } from '../types';
import { children1012286565380301759 } from '../dataset/items/1012286565380301759_children';

const router = Router();

export const childrenByItemId: Record<string, NullableValues<definitions['childItem'][]>> = {
  '1012286565380301759': children1012286565380301759,
};

router.get('/api/items/:itemId/children', (req, res, next) => {
  const children = childrenByItemId[req.params.itemId];
  if (!children) return next();

  res
    .operation('/items/{item_id}/children', 'get')
    .status(200)
    .send(
      req.query.show_invisible_items === '1'
        ? children
        : children.filter(child => child.permissions.can_view !== 'none')
    );
  next();
});

export default router;
