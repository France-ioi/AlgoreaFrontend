import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { ProgressCSVService } from 'src/app/data-access/progress-csv.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { downloadFile } from 'src/app/utils/download-file';
import { TypeFilter } from '../../models/composition-filter';

@Injectable()
export class GroupProgressGridCsvExportService {
  private progressCSVService = inject(ProgressCSVService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private destroyRef = inject(DestroyRef);

  readonly isFetching = signal(false);

  export(groupId: string, parentItemId: string, filter: TypeFilter): void {
    const downloadDataType = this.getDownloadTypeByFilter(filter);

    this.isFetching.set(true);
    this.progressCSVService
      .getCSVData(groupId, downloadDataType, [ parentItemId ])
      .pipe(
        finalize(() => this.isFetching.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: data => {
          downloadFile([ data ], `${parentItemId}-${new Date().toDateString()}.csv`, 'text/csv');
        },
        error: err => {
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  private getDownloadTypeByFilter(filter: TypeFilter): 'group' | 'team' | 'user' {
    switch (filter) {
      case 'Groups':
        return 'group';
      case 'Users':
        return 'user';
      case 'Teams':
        return 'team';
    }
  }
}
