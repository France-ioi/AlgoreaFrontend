import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FullItemRoute } from 'src/app/models/routing/item-route';

export const appInitActions = createActionGroup({
  source: 'App init',
  events: {
    init: emptyProps(),
    setDefaultRoutes: props<{ defaultActivityRoute: FullItemRoute, defaultSkillRoute: FullItemRoute | undefined }>(),
  },
});
