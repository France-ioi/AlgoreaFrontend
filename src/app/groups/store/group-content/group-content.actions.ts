import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from 'src/app/groups/models/user';
import { FetchState } from 'src/app/utils/state';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';
import { Group } from '../../data-access/get-group-by-id.service';

export const groupInfoFetchedActions = createActionGroup({
  source: 'Group-related API',
  events: {
    userFetchStateChanged: props<{ fetchState: FetchState<User> }>(),
    groupFetchStateChanged: props<{ fetchState: FetchState<Group> }>(),
    breadcrumbsFetchStateChanged: props<{ fetchState: FetchState<GroupBreadcrumbs> }>(),

  },
});

export const userPageActions = createActionGroup({
  source: 'User Page',
  events: {
    refresh: emptyProps(),
  },
});

export const groupPageActions = createActionGroup({
  source: 'Group Page',
  events: {
    refresh: emptyProps(),
  },
});
