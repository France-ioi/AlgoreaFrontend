import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { convertToError } from './error-conversion';

/**
 * Custom error handler which sends all errors to Sentry
 */
export class AlgErrorHandler extends ErrorHandler {

  private sentryErrorHandler = Sentry.createErrorHandler({
    showDialog: true,
  });

  handleError(err: any): void {
    this.sentryErrorHandler.handleError(convertToError(err));
  }

}
