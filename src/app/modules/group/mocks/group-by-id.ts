import { Group } from '../http-services/get-group-by-id.service';

export const mockGroup: Group = {
  id: '1',
  name: 'Code Dojo',
  description: 'Our group',

  current_user_is_manager: false,
};
