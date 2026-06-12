import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ProgressCSVService } from 'src/app/data-access/progress-csv.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { downloadFile } from 'src/app/utils/download-file';
import { TypeFilter } from '../../models/composition-filter';

@Injectable()
export class GroupProgressGridCsvExportService {
  private progressCSVService = inject(ProgressCSVService);
  private actionFeedbackService = inject(ActionFeedbackService);

  readonly isFetching = signal(false);

  export(groupId: string, parentItemId: string, filter: TypeFilter): void {
    const downloadDataType = this.getDownloadTypeByFilter(filter);

    this.isFetching.set(true);
    this.progressCSVService
      .getCSVData(groupId, downloadDataType, [ parentItemId ])
      .subscribe({
        next: data => {
          this.isFetching.set(false);
          downloadFile([ data ], `${parentItemId}-${new Date().toDateString()}.csv`, 'text/csv');
        },
        error: err => {
          this.isFetching.set(false);
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
