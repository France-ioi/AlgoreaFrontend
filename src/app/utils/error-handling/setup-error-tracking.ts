import * as Sentry from '@sentry/angular';
import { environment } from 'src/environments/environment';
import { version } from 'src/version';
import { getSentryDsnConfig } from 'src/app/config/crash-reporting';

export function initErrorTracking(): void {

  const sentryDsn = getSentryDsnConfig();
  if (!sentryDsn) return;

  Sentry.init({
    dsn: sentryDsn,
    environment: environment.production ? `prod-${window.location.hostname}` : 'dev',
    release: version,
    integrations: [],
    profilesSampleRate: 0, // disable profiling
    autoSessionTracking: false,
    enableTracing: false,
    ignoreErrors: [
      'Cannot redefine property: googletag',
      "Cannot read properties of undefined (reading 'sendMessage')", // a chrome extension error
      'Talisman extension',
      "can't access dead object", // a firefox error when add-ons keep references to DOM objects after their parent document was destroyed
      'ResizeObserver loop limit exceeded', // https://sentry.io/answers/react-resizeobserver-loop-completed-with-undelivered-notifications/
      "Can't find variable: WeakRef", // old Safari/Webkit browsers(<04/2020) do not know about WeakRef in JS. Used by ngx-scrollbar.
      "Can't find variable: gmo", // an error on Chrome (354 & 355) on iOS
      /change_ua/,
      'The object is in an invalid state.', // a safari error triggered by tasks when resizing
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

}
