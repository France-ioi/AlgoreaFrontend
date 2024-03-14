import * as Sentry from '@sentry/angular-ivy';

export function reportAnError(error: unknown): void {
  Sentry.captureException(error);
}
