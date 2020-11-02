import { Item } from '../http-services/get-item-by-id.service';

export const mockItem: Item = {
  id: '1',
  requires_explicit_entry: false,
  string: {
    title: 'Mock 1'
  },
  best_score: 100,
  permissions: {
    can_view: 'none',
    can_edit: 'none'
  },
  type: 'Task'
};
