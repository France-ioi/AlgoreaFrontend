import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { distinct, switchMap, map } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { ItemType } from '../../../../shared/helpers/item-type';
import { Item } from '../../http-services/get-item-by-id.service';
import { UserSessionService, WatchedGroup } from '../../../../shared/services/user-session.service';
import { GroupRouter } from '../../../../shared/routing/group-router';
import { rawGroupRoute } from '../../../../shared/routing/group-route';

interface Column {
  field: string,
  header: string,
}

interface Data {
  columns: Column[],
  rowData: (ActivityLog & { displayLoadButton: boolean })[],
}

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ],
})
export class ItemLogViewComponent implements OnChanges, OnDestroy {

  @Input() itemData?: ItemData;
  @Input() isTaskReadOnly = false;

  private readonly refresh$ = new Subject<void>();
  private readonly item$ = new ReplaySubject<Item>(1);
  readonly state$ = combineLatest([
    this.item$.pipe(distinct()),
    this.sessionService.watchedGroup$,
  ]).pipe(
    switchMap(([ item, watchedGroup ]) => this.getData$(item, watchedGroup)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private activityLogService: ActivityLogService,
    private sessionService: UserSessionService,
    private groupRouter: GroupRouter,
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

  private getData$(item: Item, watchingGroup?: WatchedGroup): Observable<Data> {
    return combineLatest([
      this.activityLogService.getActivityLog(item.id, watchingGroup?.route.id),
      this.sessionService.userProfile$,
    ]).pipe(
      map(([ data, profile ]) => ({
        columns: this.getLogColumns(item.type, watchingGroup),
        rowData: data
          .filter(log => !this.isSelfCurrentAnswer(log, profile.groupId))
          .map(log => ({ ...log, displayLoadButton: this.canDisplayLoadButton(log, profile.groupId) })),
      }))
    );
  }
  private isSelfCurrentAnswer(log: ActivityLog, profileId: string): boolean {
    return log.activityType === 'current_answer' && log.participant.id === profileId;
  }

  private canDisplayLoadButton(log: ActivityLog, profileId: string): boolean {
    if (!this.itemData) throw new Error('itemData must be defined');
    if (!log.answerId) return false;

    // Can load other user answer only in read-only mode and with correct permissions
    if (this.isTaskReadOnly) {
      const hasPermissionToLoadAnyAnswer = [ 'answer', 'answer_with_grant' ].includes(this.itemData.item.permissions.canWatch);
      return hasPermissionToLoadAnyAnswer && [ 'submission', 'saved_answer', 'current_answer' ].includes(log.activityType);
    }

    // If answer author is self, we can always load it
    if (log.user?.id === profileId) return [ 'submission', 'saved_answer' ].includes(log.activityType);

    return false;
  }

  private getLogColumns(type: ItemType, watchingGroup?: WatchedGroup): Column[] {
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
        enabled: watchingGroup && !watchingGroup.login, // only if in watching mode and watch group is not a user
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

  onUserClick(id: string): void {
    this.groupRouter.navigateTo(rawGroupRoute({ id, isUser: true }));
  }

}
