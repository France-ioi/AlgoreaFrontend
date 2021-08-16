import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemData } from '../services/item-datasource.service';
import { mockItem } from './item-by-id';

export const mockItemRoute: FullItemRoute = {
  id: '1', path: [ '1' ], attemptId: '2'
};

export const mockItemData: ItemData = {
  route: mockItemRoute,
  item: mockItem,
  breadcrumbs: [{
    itemId: '1',
    title: 'Mock 1',
    route: mockItemRoute
  }]
};
