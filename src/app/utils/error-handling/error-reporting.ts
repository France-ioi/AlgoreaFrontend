import * as Sentry from '@sentry/angular';
import { convertToError } from './error-conversion';

export function reportAnError(error: unknown): void {
  Sentry.captureException(convertToError(error));
}
