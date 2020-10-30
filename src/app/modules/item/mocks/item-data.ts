import { ItemData } from '../services/item-datasource.service';
import { mockItem } from './item-by-id';

export const mockItemData: ItemData = {
  nav: {
    itemId: '1',
    itemPath: [ '1' ]
  },
  item: mockItem,
  breadcrumbs: [{ itemId: '1', title: 'Mock 1' }]
};
