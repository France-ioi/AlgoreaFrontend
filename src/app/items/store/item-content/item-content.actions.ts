import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { State } from './item-content.state';

export const itemRouteErrorHandlingActions = createActionGroup({
  source: 'Item route error handling',
  events: {
    routeErrorHandlingChange: props<{ newState: State['routeErrorHandling'] }>(),
  },
});

export const itemByIdPageActions = createActionGroup({
  source: 'Item-by-id page',
  events: {
    refresh: emptyProps(),
    patchScore: props<{ score: number }>(),
  }
});

export const itemFetchingActions = createActionGroup({
  source: 'Item-related API',
  events: {
    itemFetchStateChanged: props<{ fetchState: State['itemState'] }>(),
    breadcrumbsFetchStateChanged: props<{ fetchState: State['breadcrumbsState'] }>(),
    resultsFetchStateChanged: props<{ fetchState: State['resultsState'] }>(),
  },
});
