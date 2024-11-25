import { FetchError, FetchState, Fetching, fetchingState } from 'src/app/utils/state';
import { User } from '../../models/user';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';
import { Group } from '../../data-access/get-group-by-id.service';
import { GroupRoute } from 'src/app/models/routing/group-route';

export type GroupInState = FetchState<Group, { id: string }>;
export type UserInState = FetchState<User, { id: string }>;

export interface State {
    /**
   * If there is a route error: whether it is currently fetching more info or there was an error while handling the error``
   * Otherwise, the value is irrelevant.
   */
  routeErrorHandling: Fetching<undefined>|FetchError,

  // if the content is currently a group/user page: the corresponding info
  group: GroupInState | UserInState,
  // if (and only if) the content is currently a group page AND the page has a path in url: the corresponding breadcrumbs
  breadcrumbs: FetchState<GroupBreadcrumbs, GroupRoute>,
}

export const initialState: State = {
  routeErrorHandling: fetchingState(),

  group: fetchingState(),
  breadcrumbs: fetchingState(),
};
