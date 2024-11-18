import { FetchState, fetchingState } from 'src/app/utils/state';
import { User } from '../../models/user';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';
import { Group } from '../../data-access/get-group-by-id.service';
import { GroupRoute, RawGroupRoute } from 'src/app/models/routing/group-route';

export interface State {
  // if the content is currently a group/user page: the corresponding info
  group: FetchState<User|Group, RawGroupRoute>,
  // if (and only if) the content is currently a group page AND the page has a path in url: the corresponding breadcrumbs
  breadcrumbs: FetchState<GroupBreadcrumbs, GroupRoute>,
}

export const initialState: State = {
  group: fetchingState(),
  breadcrumbs: fetchingState(),
};
