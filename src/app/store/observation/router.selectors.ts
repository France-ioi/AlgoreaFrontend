import { createSelector } from '@ngrx/store';
import { selectQueryParam } from '../router/router.selectors';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { queryParamValueToBool } from 'src/app/utils/url';

const watchedGroupQueryParam = 'watchedGroupId';
const watchedGroupIsUserQueryParam = 'watchUser';
const noWatchingValue = 'none'; // value of `watchedGroupQueryParam` which means that there is no watching

const selectObservedGroupIdFromRouter = selectQueryParam(watchedGroupQueryParam);
const selectObservedGroupIsUserFromRouter = selectQueryParam(watchedGroupIsUserQueryParam);
export const selectObservedGroupRouteFromRouter = createSelector(
  selectObservedGroupIdFromRouter,
  selectObservedGroupIsUserFromRouter,
  (id: string|undefined, isUser: string|undefined) => {
    if (!id) return undefined;
    if (id === noWatchingValue) return null;
    return rawGroupRoute({ id, isUser: !!queryParamValueToBool(isUser) });
  }
);
