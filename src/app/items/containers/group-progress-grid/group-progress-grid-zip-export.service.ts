import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { GroupResultsExportService } from 'src/app/data-access/group-results-export.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { mapConfiguredExportServiceError } from './group-progress-grid-zip-export.display';
import { mapZipExportError, readHttpActionError } from './group-progress-grid-zip-export.errors';
import { areGroupResultsExportNotificationsAvailable } from './group-progress-grid-zip-export.utils';

@Injectable()
export class GroupProgressGridZipExportService {
  private groupResultsExportService = inject(GroupResultsExportService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private config = inject(APPCONFIG);
  private destroyRef = inject(DestroyRef);

  readonly isFetching = signal(false);

  export(groupId: string, parentItemId: string): void {
    if (this.isFetching()) return;

    if (!areGroupResultsExportNotificationsAvailable(this.config)) {
      this.actionFeedbackService.error(
        $localize`ZIP export is unavailable because notifications are disabled.`,
      );
      return;
    }

    this.isFetching.set(true);
    this.groupResultsExportService
      .getGroupResultsToken(groupId, [ parentItemId ])
      .pipe(
        switchMap(({ groupResultsToken }) =>
          this.groupResultsExportService.requestExport(groupResultsToken, groupId, [ parentItemId ])
        ),
        tap(() => {
          this.actionFeedbackService.success(
            $localize`Export requested. You will be notified when the file is ready.`,
          );
        }),
        catchError((err: unknown) => {
          this.handleExportError(err);
          return EMPTY;
        }),
        finalize(() => this.isFetching.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private handleExportError(err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      const { status, errorText } = readHttpActionError(err);
      this.showFeedback(mapZipExportError(status, errorText));
      return;
    }
    if (err instanceof Error && err.message.includes('slsApiUrl')) {
      this.showFeedback(mapConfiguredExportServiceError());
      return;
    }
    this.showFeedback({ type: 'unexpected' });
  }

  private showFeedback(feedback: ReturnType<typeof mapZipExportError>): void {
    if (feedback.type === 'unexpected') {
      this.actionFeedbackService.unexpectedError();
      return;
    }
    const options = feedback.life !== undefined ? { life: feedback.life } : undefined;
    this.actionFeedbackService.error(feedback.message, options);
  }
}
