import { Item } from '../../data-access/get-item-by-id.service';

export const mockItem: Item = {
  id: '1',
  requires_explicit_entry: false,
  string: {
    title: 'Mock 1'
  },
  best_score: 100,
  permissions: {
    can_view: 'none',
    can_edit: 'none',
    can_grant_view: 'none',
  },
  type: 'Task',
  prompt_to_join_group_by_code: false,
  validation_type: 'none',
  no_score: false,
  title_bar_visible: false,
  full_screen: '',
};
