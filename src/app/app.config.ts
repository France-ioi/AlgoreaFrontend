import { InjectionToken } from '@angular/core';
import { Environment } from './utils/config';

export type AppConfig = Exclude<Environment, 'production'>;

export const APPCONFIG = new InjectionToken<AppConfig>(
  'Configuration',
  {
    factory: (): AppConfig => {
      if (!('appConfig' in window)) {
        throw new Error('No environment config found!');
      }
      const environmentConfiguration = window.appConfig;
      delete window.appConfig;
      return environmentConfiguration as AppConfig;
    },
  },
);
