import * as Sentry from '@sentry/angular';

export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
