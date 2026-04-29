import * as Sentry from '@sentry/angular';
import type { ReportDialogOptions } from '@sentry/angular';
import { convertToError } from './error-conversion';

/**
 * Indirection around Sentry calls so tests can spy on them: the `@sentry/angular` ESM
 * namespace exports functions as read-only, non-configurable bindings, which prevents
 * `spyOn(Sentry, ...)` from working. Production code goes through this object.
 */
export const sentryReporter = {
  captureException: (error: unknown): string => Sentry.captureException(error),
  showReportDialog: (options: ReportDialogOptions): void => Sentry.showReportDialog(options),
};

export function reportAnError(error: unknown): void {
  sentryReporter.captureException(convertToError(error));
}
