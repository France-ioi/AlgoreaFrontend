import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { from, EMPTY, throwError } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { ProgressZipService } from 'src/app/data-access/progress-zip.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { getContentDispositionFilename } from 'src/app/utils/content-disposition-filename';
import { downloadFile } from 'src/app/utils/download-file';
import { readHttpBlobError } from 'src/app/utils/http-blob-error';
import { mapZipExportError } from './group-progress-grid-zip-export.errors';

@Injectable()
export class GroupProgressGridZipExportService {
  private progressZipService = inject(ProgressZipService);
  private actionFeedbackService = inject(ActionFeedbackService);

  readonly isFetching = signal(false);

  export(groupId: string, parentItemId: string): void {
    this.isFetching.set(true);
    this.progressZipService
      .getZipData(groupId, [ parentItemId ])
      .pipe(
        tap(response => {
          const blob = response.body;
          if (!blob) throw new Error('Unexpected: empty ZIP response body');
          const filename = getContentDispositionFilename(
            response.headers.get('Content-Disposition'),
            groupId,
          );
          downloadFile([ blob ], filename, 'application/zip');
        }),
        catchError((err: unknown) => {
          if (!(err instanceof HttpErrorResponse)) return throwError(() => err);
          return from(readHttpBlobError(err)).pipe(
            tap(({ status, errorText }) => this.showExportError(status, errorText)),
            switchMap(() => EMPTY),
          );
        }),
        finalize(() => this.isFetching.set(false)),
      )
      .subscribe({
        error: err => {
          // Mirrors CSV export: rethrow non-HTTP failures so programmer errors surface in dev tools.
          throw err;
        },
      });
  }

  private showExportError(status: number, errorText?: string): void {
    const feedback = mapZipExportError(status, errorText);
    if (feedback.type === 'unexpected') {
      this.actionFeedbackService.unexpectedError();
      return;
    }
    const options = feedback.life !== undefined ? { life: feedback.life } : undefined;
    this.actionFeedbackService.error(feedback.message, options);
  }
}
