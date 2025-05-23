import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AppConfig } from 'src/app/app.config';
import { FullItemRoute } from 'src/app/models/routing/item-route';

export const appInitActions = createActionGroup({
  source: 'App init',
  events: {
    init: emptyProps(),
    loadConfig: props<{ config: AppConfig }>(),
    setDefaultRoutes: props<{ defaultActivityRoute: FullItemRoute, defaultSkillRoute: FullItemRoute | undefined }>(),
  },
});
