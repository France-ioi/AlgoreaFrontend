import { createActionGroup, props } from '@ngrx/store';

export const interceptorActions = createActionGroup({
  source: 'Time offset interceptor',
  events: {
    reportOffset: props<{ offset: number }>(),
  },
});

