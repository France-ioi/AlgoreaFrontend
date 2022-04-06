import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

import { AppModule } from './app/core/app.module';
import { appConfig } from './app/shared/helpers/config';
import { version } from './version';

if (appConfig.sentryDsn) {
  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.production ? 'prod' : 'dev',
    release: version,
    integrations: [
      new BrowserTracing({
        tracingOrigins: [ appConfig.apiUrl, appConfig.oauthServerUrl ],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

if (appConfig.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
