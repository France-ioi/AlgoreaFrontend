import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { Observable, ReplaySubject } from 'rxjs';
import { distinct, switchMap, map } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { ItemType } from '../../../../shared/helpers/item-type';
import { Item } from '../../http-services/get-item-by-id.service';

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

  private readonly item$ = new ReplaySubject<Item>(1);
  readonly state$ = this.getData$().pipe(
    mapToFetchState(),
  );

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

  ngOnChanges(): void {
    if (!this.itemData) {
      return;
    }

    this.item$.next(this.itemData.item);
  }

  private getData$(): Observable<Data> {
    return this.item$.pipe(
      distinct(),
      switchMap(item => this.activityLogService.getActivityLog(item.id).pipe(
        map((data: ActivityLog[]) => ({
          columns: this.getLogColumns(item.type),
          rowData: data
        }))
      ))
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
