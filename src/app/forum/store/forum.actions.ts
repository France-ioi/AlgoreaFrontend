import { createActionGroup, props } from '@ngrx/store';

export const configActions = createActionGroup({
  source: 'Config',
  events: {
    forumEnabled: props<{ enabled: boolean }>(),
  },
});
