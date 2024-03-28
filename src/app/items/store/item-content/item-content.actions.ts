import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { State } from './item-content.state';

export const itemRouteErrorHandlingActions = createActionGroup({
  source: 'Item route error handling',
  events: {
    routeErrorHandlingChange: props<{ newState: State['routeErrorHandling'] }>(),
  },
});

export const forumActions = createActionGroup({
  source: 'Forum',
  events: {
    setAnswer: props<{ answer: string }>(),
  },
});

export const cleanupActions = createActionGroup({
  source: 'Cleanup effect',
  events: {
    clearAnswer: emptyProps(),
  },
});
