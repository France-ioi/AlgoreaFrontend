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
  /**
   * list of errors which have already been reported in this session so that we do not report the same one several times
   */
  private reportedErrors: string[] = [];

  constructor(private chunkErrorService: ChunkErrorService) {
    super();
  }

  override handleError(err: any): void {
    if (this.isChunkLoadingError(err)) {
      this.chunkErrorService.emitError();
      return;
    }
    const error = convertToError(err);
    const eventId = Sentry.captureException(error);

    if (!this.isDialogOpen && !this.reportedErrors.includes(error.toString())) {
      this.isDialogOpen = true;
      this.reportedErrors.push(error.toString());
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
