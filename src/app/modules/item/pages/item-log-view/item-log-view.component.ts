import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { Observable, ReplaySubject } from 'rxjs';
import { distinct, switchMap, map } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { ItemType } from '../../../../shared/helpers/item-type';

interface Column {
  field: string,
  header: string
}

interface Data {
  columns: Column[],
  rowData: ActivityLog[]
}

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ],
})
export class ItemLogViewComponent implements OnChanges {

  @Input() itemData?: ItemData;
  @Input() isWatchingGroup = false;

  logColumns?: Column[];

  private readonly id$ = new ReplaySubject<string>(1);
  readonly state$ = this.id$.pipe(
    distinct(),
    switchMap(id => this.getData$(id)),
    mapToFetchState(),
  );

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

  ngOnChanges(): void {
    if (!this.itemData) {
      return;
    }

    this.id$.next(this.itemData.item.id);
    this.logColumns = this.getLogColumns(this.itemData.item.type);
  }

  private getData$(id: string): Observable<Data> {
    return this.activityLogService.getActivityLog(id).pipe(
      map((data: ActivityLog[]) => ({
        columns: this.logColumns || [],
        rowData: data
      }))
    );
  }

  private getLogColumns(type: ItemType): Column[] {
    const columns = [
      {
        field: 'activity_type',
        header: $localize`Action`,
        enabled: true,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
        enabled: ![ 'Task', 'Course' ].includes(type),
      },
      {
        field: 'item.user',
        header: $localize`User`,
        enabled: this.isWatchingGroup && [ 'Chapter', 'Task', 'Course' ].includes(type),
      },
      {
        field: 'at',
        header: $localize`Time`,
        enabled: true,
      }
    ];

    return columns.filter(item => item.enabled).map(item => ({
      field: item.field,
      header: item.header,
    }));
  }

}
