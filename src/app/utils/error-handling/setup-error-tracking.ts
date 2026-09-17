import { HttpErrorResponse } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import type { ErrorEvent, EventHint } from '@sentry/angular';
import { environment } from 'src/environments/environment';
import { version } from 'src/version';
import { getSentryDsnConfig } from 'src/app/config/crash-reporting';
import { HTTPError } from './error-conversion';

/**
 * Drop network/backend failures from Sentry as a safety net for any path that bypasses the
 * per-call-site filtering (raw `HttpErrorResponse`) or that captures a value already wrapped
 * by `convertToError` (`HTTPError`).
 */
export function dropHttpErrors(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const ex = hint.originalException;
  if (ex instanceof HttpErrorResponse) return null;
  if (ex instanceof HTTPError) return null;
  return event;
}

/** Types seen for Firefox privacy/storage noise (ALGOREA-GA); avoid dropping all NS_ERROR_*. */
const OPAQUE_FIREFOX_NS_TYPES = new Set([ 'NS_ERROR_FAILURE', 'NS_ERROR_ABORT' ]);

function isOpaqueNsMessage(message: string): boolean {
  const trimmed = message.trim();
  return trimmed === '' || trimmed === 'No error message';
}

function isOpaqueFirefoxNsError(type: string, message: string): boolean {
  return OPAQUE_FIREFOX_NS_TYPES.has(type) && isOpaqueNsMessage(message);
}

function isOpaqueFirefoxNsException(ex: unknown): boolean {
  if (ex === null || ex === undefined || typeof ex !== 'object') return false;
  const name = 'name' in ex && typeof ex.name === 'string' ? ex.name : '';
  const message = 'message' in ex && typeof ex.message === 'string' ? ex.message : '';
  return isOpaqueFirefoxNsError(name, message);
}

/**
 * Firefox often throws opaque NS_ERROR_FAILURE / NS_ERROR_ABORT ("No error message") when
 * storage is blocked under privacy modes. Those are not actionable frontend bugs — drop them
 * so they do not flood Sentry (see ALGOREA-GA).
 *
 * Only those two types with an empty/opaque message are dropped. Mixed exception chains that
 * include any other error are kept.
 */
export function dropOpaqueFirefoxNsErrors(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const values = event.exception?.values ?? [];
  if (values.length > 0) {
    // Drop only when every serialized exception is opaque FAILURE/ABORT.
    const allOpaque = values.every(v => isOpaqueFirefoxNsError(v.type ?? '', v.value ?? ''));
    return allOpaque ? null : event;
  }
  // No exception.values — fall back to the original thrown object (e.g. DOMException).
  return isOpaqueFirefoxNsException(hint.originalException) ? null : event;
}

export function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (dropHttpErrors(event, hint) === null) return null;
  return dropOpaqueFirefoxNsErrors(event, hint);
}

export function initErrorTracking(): void {

  const sentryDsn = getSentryDsnConfig();
  if (!sentryDsn) return;

  Sentry.init({
    dsn: sentryDsn,
    environment: environment.production ? `prod-${window.location.hostname}` : 'dev',
    release: version,
    integrations: [],
    profilesSampleRate: 0, // disable profiling
    tracesSampleRate: 0,
    beforeSend,
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
