import { FetchState } from 'src/app/utils/state';
import { User } from '../../models/user';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';

export interface GroupInfo { name: string, currentUserCanGrantAccess: boolean }

export interface State {
  user: FetchState<User> | null,
  // if (and only if) the content is currently a user page AND the page has a path in url: the corresponding breadcrumbs
  breadcrumbs: FetchState<GroupBreadcrumbs> | null,
}

export const initialState: State = {
  user: null,
  breadcrumbs: null,
};
