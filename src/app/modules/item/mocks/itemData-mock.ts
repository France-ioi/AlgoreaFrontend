import { ItemData } from '../services/item-datasource.service';

export const mockItemData: ItemData = {
  item: {
    id: '11',
    requires_explicit_entry: true,
    string: {
    title: 'mock item',
    subtitle: 'mock subtitle',
    description: 'mock description',
    },
    permissions: {
      can_view: 'content',
      can_edit: 'all',
    },
    type: 'Chapter',
  },
  attemptId: '0',
  breadcrumbs: [],
  nav: {
    itemId: '11',
    itemPath: [],
  },
};
