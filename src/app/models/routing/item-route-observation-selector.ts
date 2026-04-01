import { createSelector } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { isUser } from './group-route';

/**
 * Selector to get the currently observed group as an item route parameter
 */
export const selectObservedGroupRouteAsItemRouteParameter = createSelector(
  fromObservation.selectObservedGroupRoute,
  route => (route !== null ? { observedGroup: { id: route.id, isUser: isUser(route) } } : {})
);
