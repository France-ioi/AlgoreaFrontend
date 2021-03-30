import { Component, Input, OnChanges } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { ReplaySubject } from 'rxjs';
import { distinct, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ]
})
export class ItemLogViewComponent implements OnChanges {

  @Input() itemData?: ItemData;

  private readonly id$ = new ReplaySubject<string>(1);
  readonly state$ = this.id$.pipe(
    distinct(),
    switchMap(id => this.activityLogService.getActivityLog(id)),
    mapToFetchState(),
  );

  constructor(
    private activityLogService: ActivityLogService
  ) {}

  ngOnChanges(): void {
    if (this.itemData) this.id$.next(this.itemData.item.id);
  }

}
