import { createActionGroup, props } from '@ngrx/store';
import { ContentRoute } from 'src/app/models/routing/content-route';

export const changedContentActions = createActionGroup({
  source: 'Router',
  events: {
    changeContent: props<{ route: ContentRoute|null }>(),
  },
});
