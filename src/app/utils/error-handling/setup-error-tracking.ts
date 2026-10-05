import { HttpErrorResponse } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import type { Breadcrumb, BreadcrumbHint, ErrorEvent, EventHint } from '@sentry/angular';
import { environment } from 'src/environments/environment';
import { getSentryDsnConfig } from 'src/app/config/crash-reporting';
import { readAppVersionFromDocument } from 'src/app/utils/app-version';
import { HTTPError } from './error-conversion';

/**
 * CORS-exposed origin headers (`ExposedHeaders: Date, Backend-Version`).
 * `backend-version`/`date` are only meaningful if they appear on successful API 200 breadcrumbs;
 * absence otherwise proves nothing.
 */
const ENRICHED_RESPONSE_HEADERS = [ 'cache-control', 'content-type', 'backend-version', 'date' ] as const;
/** Keep breadcrumbs small; do not dump full error pages or HTML from local interceptors. */
const MAX_BODY_LENGTH = 200;

type BreadcrumbDataExtra = Record<string, string | number | boolean>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasGetResponseHeader(xhr: unknown): xhr is { getResponseHeader: (name: string) => string | null } {
  return isRecord(xhr) && typeof xhr['getResponseHeader'] === 'function';
}

function hasHeadersGet(headers: unknown): headers is { get: (name: string) => string | null } {
  return isRecord(headers) && typeof headers['get'] === 'function';
}

function durationData(hint: unknown): BreadcrumbDataExtra {
  if (!isRecord(hint)) return {};
  const start = hint['startTimestamp'];
  const end = hint['endTimestamp'];
  if (!isFiniteNumber(start) || !isFiniteNumber(end)) return {};
  return { duration_ms: Math.round(end - start) };
}

function copyAllowListedHeaders(readHeader: (name: string) => string | null): BreadcrumbDataExtra {
  const extra: BreadcrumbDataExtra = {};
  for (const name of ENRICHED_RESPONSE_HEADERS) {
    try {
      const value = readHeader(name);
      if (value !== null) extra[`response.${name}`] = value;
    } catch {
      // Firefox can throw on some getResponseHeader reads; keep other fields.
    }
  }
  return extra;
}

function fetchResponseHeaders(response: unknown): BreadcrumbDataExtra {
  if (!isRecord(response)) return {};
  const headers = response['headers'];
  if (!hasHeadersGet(headers)) return {};
  return copyAllowListedHeaders(name => headers.get(name));
}

function xhrErrorBody(xhr: unknown, data: unknown): BreadcrumbDataExtra {
  if (!isRecord(data)) return {};
  const statusCode = data['status_code'];
  if (!isFiniteNumber(statusCode) || statusCode < 400) return {};
  if (!isRecord(xhr)) return {};
  if (xhr['responseType'] !== '' && xhr['responseType'] !== 'text') return {};
  try {
    const text = xhr['responseText'];
    if (typeof text !== 'string') return {};
    const truncated = text.length > MAX_BODY_LENGTH;
    // Empty 4xx `responseText` (`''`) is a diagnostic signal; do not omit empty strings.
    const extra: BreadcrumbDataExtra = { response_body: truncated ? text.slice(0, MAX_BODY_LENGTH) : text };
    if (truncated) extra['response_body_truncated'] = true;
    return extra;
  } catch {
    return {};
  }
}

function enrichXhrBreadcrumb(breadcrumb: Breadcrumb, hint: unknown): Breadcrumb {
  if (!isRecord(hint)) return breadcrumb;
  const xhr = hint['xhr'];
  if (!hasGetResponseHeader(xhr)) return breadcrumb;
  const extra: BreadcrumbDataExtra = {
    ...durationData(hint),
    ...copyAllowListedHeaders(name => xhr.getResponseHeader(name)),
    ...xhrErrorBody(xhr, breadcrumb.data),
  };
  return { ...breadcrumb, data: { ...breadcrumb.data, ...extra } };
}

function enrichFetchBreadcrumb(breadcrumb: Breadcrumb, hint: unknown): Breadcrumb {
  if (!isRecord(hint)) return breadcrumb;
  const response = hint['response'];
  if (response === undefined || response === null) return breadcrumb;
  // Fetch bodies are streams; reading them would consume the response and is not done here.
  const extra: BreadcrumbDataExtra = {
    ...durationData(hint),
    ...fetchResponseHeaders(response),
  };
  return { ...breadcrumb, data: { ...breadcrumb.data, ...extra } };
}

/**
 * Adds duration, allow-listed response headers, and a truncated error body to Sentry http breadcrumbs.
 * Does not capture events; Sentry does not catch exceptions from this hook.
 */
export function beforeBreadcrumb(breadcrumb: Breadcrumb, hint?: BreadcrumbHint): Breadcrumb {
  try {
    if (breadcrumb.category === 'xhr') return enrichXhrBreadcrumb(breadcrumb, hint);
    if (breadcrumb.category === 'fetch') return enrichFetchBreadcrumb(breadcrumb, hint);
    return breadcrumb;
  } catch {
    return breadcrumb;
  }
}

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
    release: readAppVersionFromDocument(document) ?? undefined,
    integrations: [],
    profilesSampleRate: 0, // disable profiling
    tracesSampleRate: 0,
    beforeSend,
    beforeBreadcrumb,
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
