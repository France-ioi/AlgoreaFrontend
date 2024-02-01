import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from 'src/app/groups/models/user';
import { FetchState } from 'src/app/utils/state';
import { GroupBreadcrumbs } from '../../models/group-breadcrumbs';

export const userInfoFetchedActions = createActionGroup({
  source: 'User API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<User> }>(),
  },
});

export const breadcrumbsFetchedActions = createActionGroup({
  source: 'Group breadcrumbs API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<GroupBreadcrumbs> }>(),
  },
});

export const userPageActions = createActionGroup({
  source: 'User Page',
  events: {
    refresh: emptyProps(),
  },
});
