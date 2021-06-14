import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';

interface Column {
  field: string,
  header: string
}

interface Data {
  columns: Column[],
  rowData: ActivityLog[]
}

@Component({
  selector: 'alg-group-log-view',
  templateUrl: './group-log-view.component.html',
  styleUrls: [ './group-log-view.component.scss' ],
})
export class GroupLogViewComponent implements OnChanges, OnDestroy {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  private readonly groupId$ = new ReplaySubject<string>(1);
  readonly state$ = this.groupId$.pipe(
    switchMap((groupId: string) => this.getData$(groupId)),
    mapToFetchState(),
  );

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

  ngOnChanges(): void {
    if (!this.groupId) {
      return;
    }

    this.groupId$.next(this.groupId);
  }

  ngOnDestroy(): void {
    this.groupId$.complete();
  }

  private getData$(groupId: string): Observable<Data> {
    return this.activityLogService.getAllActivityLog(groupId).pipe(
      map((data: ActivityLog[]) => ({
        columns: this.getLogColumns(),
        rowData: data
      }))
    );
  }

  private getLogColumns(): Column[] {
    const columns = [
      {
        field: 'activityType',
        header: $localize`Action`,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
      },
      {
        field: 'item.user',
        header: $localize`User`,
        disabled: !this.showUserColumn,
      },
      {
        field: 'at',
        header: $localize`Time`,
      }
    ];

    return columns.filter(item => !item.disabled).map(item => ({
      field: item.field,
      header: item.header,
    }));
  }

}
