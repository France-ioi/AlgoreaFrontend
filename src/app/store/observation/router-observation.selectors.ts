import { createSelector } from '@ngrx/store';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { queryParamValueToBool } from 'src/app/utils/url';
import { fromRouter } from '../router/router.store';

const watchedGroupQueryParam = 'watchedGroupId';
const watchedGroupIsUserQueryParam = 'watchUser';
const noWatchingValue = 'none'; // value of `watchedGroupQueryParam` which means that there is no watching

const selectObservedGroupIdFromRouter = fromRouter.selectQueryParam(watchedGroupQueryParam);
const selectObservedGroupIsUserFromRouter = fromRouter.selectQueryParam(watchedGroupIsUserQueryParam);
export const selectObservedGroupRouteFromRouter = createSelector(
  selectObservedGroupIdFromRouter,
  selectObservedGroupIsUserFromRouter,
  (id, isUser) => {
    if (!id) return undefined;
    if (id === noWatchingValue) return null;
    return rawGroupRoute({ id, isUser: !!queryParamValueToBool(isUser) });
  }
);
