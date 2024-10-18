import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { convertToError } from './error-conversion';
import { ChunkErrorService } from '../../services/chunk-error.service';

/**
 * Custom error handler which sends all errors to Sentry
 */
@Injectable()
export class AlgErrorHandler extends ErrorHandler {

  private isDialogOpen = false;

  constructor(private chunkErrorService: ChunkErrorService) {
    super();
  }

  handleError(err: any): void {
    if (this.isChunkLoadingError(err)) {
      this.chunkErrorService.emitError();
      return;
    }
    const error = convertToError(err);
    const eventId = Sentry.captureException(error);
    if (!this.isDialogOpen) {
      this.isDialogOpen = true;
      Sentry.showReportDialog({ eventId, onClose: () => this.isDialogOpen = false });
    }
  }

  isChunkLoadingError(err: any): boolean {
    const chunkErrormessages = [
      'Loading chunk [a-z_\\d]+ failed', // older ?
      'Failed to fetch dynamically imported module', // chrome
      'error loading dynamically imported module', // firefox
      'Importing a module script failed', // safari
    ];
    return new RegExp(chunkErrormessages.map(m => `(${m})`).join('|')).test(convertToError(err).message);
  }

}
