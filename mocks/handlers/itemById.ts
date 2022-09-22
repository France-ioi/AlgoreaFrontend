import { Router } from 'express';
import { definitions, NullableValues } from '../types';
import { item1012286565380301759 } from '../dataset/items/1012286565380301759_chapter';
import { item4102 } from '../dataset/items/4102_parcours-officiel_chapter';
import { childrenByItemId } from './itemChildren';

const router = Router();

const items: Record<string, NullableValues<definitions['itemResponse']>> = {
  '4102': item4102,
  '1012286565380301759': item1012286565380301759,
};

router.get('/api/items/:itemId', (req, res, next) => {
  const item = items[req.params.itemId];
  if (!item) return next();

  res
    .operation('/items/{item_id}', 'get')
    .status(200)
    .send(item);
  next();
});

router.put('/api/items/:itemId', (req, res, next) => {
  const item = items[req.params.itemId];
  if (!item && !childrenByItemId[req.params.itemId]) return next();

  Object.assign(item as any, req.body);

  res
    .operation('/items/{item_id}', 'put')
    .status(200)
    .send({ message: 'updated', success: true });
  next();
});

router.delete('/api/items/:itemId', (req, res, next) => {
  const item = items[req.params.itemId];
  if (!item) return next();

  delete items[req.params.itemId];
  res
    .operation('/items/{item_id}', 'delete')
    .status(200)
    .send({ message: 'deleted', success: true });
  next();
});

export default router;
