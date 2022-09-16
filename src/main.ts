import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';

import { AppModule } from './app/core/app.module';
import { appConfig } from './app/shared/helpers/config';
import { version } from './version';

Sentry.init({
  dsn: appConfig.sentryDsn,
  environment: appConfig.production ? `prod-${window.location.hostname}` : 'dev',
  release: version,
  integrations: [],
});

if (appConfig.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
