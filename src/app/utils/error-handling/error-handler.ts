import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { convertToError } from './error-conversion';
import { ChunkErrorService } from '../../services/chunk-error.service';

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
    const chunkErrormessages = [
      'Loading chunk [a-z_\\d]+ failed', // older ?
      'Failed to fetch dynamically imported module', // chrome
      'error loading dynamically imported module', // firefox
      'Importing a module script failed', // safari
    ];
    if (new RegExp(chunkErrormessages.map(m => `(${m})`).join('|')).test(convertToError(err).message)) {
      this.chunkErrorService.emitError();
      return;
    }
    this.sentryErrorHandler.handleError(convertToError(err));
  }

}
