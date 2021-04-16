import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { Observable, ReplaySubject } from 'rxjs';
import { distinct, switchMap, map } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';

interface Column {
  field: string,
  header: string
}

const logColumns: Column[] = [
  {
    field: 'activity_type',
    header: $localize`Action`
  },
  {
    field: 'item.string.title',
    header: $localize`Content`
  },
  {
    field: 'at',
    header: $localize`Time`
  }
];

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
    if (this.itemData) this.id$.next(this.itemData.item.id);
  }

  getData$(id: string): Observable<Data> {
    return this.activityLogService.getActivityLog(id).pipe(
      map((data: ActivityLog[]) => ({
        columns: logColumns,
        rowData: data
      }))
    );
  }

}
