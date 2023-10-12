import * as Sentry from '@sentry/angular-ivy';

export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
