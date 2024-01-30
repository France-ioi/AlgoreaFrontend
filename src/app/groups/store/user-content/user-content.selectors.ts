import { createSelector } from '@ngrx/store';
import { pathFromParamValue } from 'src/app/models/routing/content-route';
import { contentTypeOfPath, groupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { fromRouter } from 'src/app/store';

export const selectIsUserContentActive = createSelector(
  fromRouter.selectPath,
  path => !!path && contentTypeOfPath(path) === 'user'
);

export const selectActiveContentUserId = createSelector(
  selectIsUserContentActive,
  fromRouter.selectParam('id'),
  (isActive, id) => (isActive && id ? id : null)
);

const selectActiveContentUserPath = createSelector(
  selectIsUserContentActive,
  fromRouter.selectParam('path'),
  (isActive, path) => (isActive && path ? pathFromParamValue(path) : null)
);

export const selectActiveContentUserRoute = createSelector(
  selectActiveContentUserId,
  selectActiveContentUserPath,
  (id, path) => (id ? (path ? groupRoute({ id, isUser: true }, path) : rawGroupRoute({ id, isUser: true })) : null)
);
