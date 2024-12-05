import { createActionGroup, props } from '@ngrx/store';
import { State } from './current-content.state';

export const contentPageActions = createActionGroup({
  source: 'Content page',
  events: {
    changeContent: props<{ route: State['route'], title?: State['title'], breadcrumbs?: State['breadcrumbs'] }>(),
  },
});
