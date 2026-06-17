import { createActionGroup, props } from '@ngrx/store';
import { AppConfig } from 'src/app/config';

export const configActions = createActionGroup({
  source: 'Config',
  events: {
    loadConfig: props<{ config: AppConfig }>(),
  },
});
