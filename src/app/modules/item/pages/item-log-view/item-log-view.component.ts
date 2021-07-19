import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
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
export class ItemLogViewComponent implements OnChanges, OnDestroy {

  @Input() itemData?: ItemData;
  @Input() isWatchingGroup = false;

  private readonly refresh$ = new Subject<void>();
  private readonly item$ = new ReplaySubject<Item>(1);
  readonly state$ = this.item$.pipe(
    distinct(),
    switchMap((item: Item) => this.getData$(item)),
    mapToFetchState({ resetter: this.refresh$ }),
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

  ngOnDestroy(): void {
    this.item$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  private getData$(item: Item): Observable<Data> {
    return this.activityLogService.getActivityLog(item.id).pipe(
      map((data: ActivityLog[]) => ({
        columns: this.getLogColumns(item.type),
        rowData: data
      }))
    );
  }

  private getLogColumns(type: ItemType): Column[] {
    const columns = [
      {
        field: 'activityType',
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
