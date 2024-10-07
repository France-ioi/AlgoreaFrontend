import * as Sentry from '@sentry/angular';
import { appConfig } from '../config';
import { version } from 'src/version';

export function initErrorTracking(): void {

  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.production ? `prod-${window.location.hostname}` : 'dev',
    release: version,
    integrations: [],
    ignoreErrors: [
      'Cannot redefine property: googletag',
      "Cannot read properties of undefined (reading 'sendMessage')", // a chrome extension error
      'Talisman extension',
      "can't access dead object", // a firefox error when add-ons keep references to DOM objects after their parent document was destroyed
      'ResizeObserver loop limit exceeded', // https://sentry.io/answers/react-resizeobserver-loop-completed-with-undelivered-notifications/
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
