import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { isChunkLoadingErrorMessage } from './chunk-loading-error';
import { convertToError } from './error-conversion';
import { sentryReporter } from './error-reporting';
import { ChunkErrorService } from '../../services/chunk-error.service';

/**
 * Custom error handler which sends all errors to Sentry
 */
@Injectable()
export class AlgErrorHandler extends ErrorHandler {
  private chunkErrorService = inject(ChunkErrorService);


  private isDialogOpen = false;
  /**
   * list of errors which have already been reported in this session so that we do not report the same one several times
   */
  private reportedErrors: string[] = [];

  override handleError(err: unknown): void {
    if (this.isChunkLoadingError(err)) {
      this.chunkErrorService.emitError();
      return;
    }
    // HTTP errors are network/backend issues, not local frontend bugs: do not capture or show
    // the crash dialog. They are also dropped by Sentry's beforeSend as a safety net.
    if (err instanceof HttpErrorResponse) return;
    const error = convertToError(err);
    const eventId = sentryReporter.captureException(error);

    if (!this.isDialogOpen && !this.reportedErrors.includes(error.toString())) {
      this.isDialogOpen = true;
      this.reportedErrors.push(error.toString());
      sentryReporter.showReportDialog({ eventId, onClose: () => this.isDialogOpen = false });
    }
  }

  isChunkLoadingError(err: unknown): boolean {
    return isChunkLoadingErrorMessage(convertToError(err).message);
  }

}
