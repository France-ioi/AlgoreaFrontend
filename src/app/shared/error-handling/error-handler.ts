import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';
import { convertToError } from './error-conversion';
import { ChunkErrorService } from '../../core/services/chunk-error.service';

/**
 * Custom error handler which sends all errors to Sentry
 */
@Injectable()
export class AlgErrorHandler extends ErrorHandler {

  private sentryErrorHandler = Sentry.createErrorHandler({
    showDialog: true,
  });

  constructor(private chunkErrorService: ChunkErrorService) {
    super();
  }

  handleError(err: any): void {
    const regExp = /Loading chunk [a-z_\d]+ failed/;
    if (regExp.test(convertToError(err).message)) {
      this.chunkErrorService.emitError();
      return;
    }
    this.sentryErrorHandler.handleError(convertToError(err));
  }

}
