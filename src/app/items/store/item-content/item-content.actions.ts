import { createActionGroup, props } from '@ngrx/store';
import { State } from './item-content.state';

export const itemRouteErrorHandlingActions = createActionGroup({
  source: 'Item route error handling',
  events: {
    routeErrorHandlingChange: props<{ newState: State['routeErrorHandling'] }>(),
  },
});
