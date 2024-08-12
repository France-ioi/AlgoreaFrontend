import * as Sentry from '@sentry/angular';

export function reportAnError(error: unknown): void {
  Sentry.captureException(error);
}
