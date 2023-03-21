import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular-ivy';

import { AppModule } from './app/core/app.module';
import { appConfig } from './app/shared/helpers/config';
import { version } from './version';

Sentry.init({
  dsn: appConfig.sentryDsn,
  environment: appConfig.production ? `prod-${window.location.hostname}` : 'dev',
  release: version,
  integrations: [],
  ignoreErrors: [
    "Cannot read properties of undefined (reading 'sendMessage')", // a chrome extension error
    "can't access dead object", // a firefox error when add-ons keep references to DOM objects after their parent document was destroyed
  ],
  // from https://docs.sentry.io/clients/javascript/tips/
  denyUrls: [
    // Google Adsense
    /pagead\/js/i,
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i
  ],
});

if (appConfig.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
