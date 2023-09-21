import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { ItemType } from '../../../../shared/helpers/item-type';
import { Item } from '../../http-services/get-item-by-id.service';
import { GroupWatchingService, WatchedGroup } from 'src/app/core/services/group-watching.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { allowsWatchingAnswers } from 'src/app/shared/models/domain/item-watch-permission';
import { DataPager } from 'src/app/shared/helpers/data-pager';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
interface Column {
  field: string,
  header: string,
}

const logsLimit = 20;

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ],
})
export class ItemLogViewComponent implements OnChanges, OnDestroy, OnInit {

  @Input() itemData?: ItemData;

  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLog): Observable<ActivityLog[]> => this.getRows(pageSize, latestRow),
    pageSize: logsLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  private readonly item$ = new ReplaySubject<Item>(1);
  readonly state$ = combineLatest([
    this.datapager.list$,
    this.sessionService.userProfile$,
  ]).pipe(
    map(([ fetchData, profile ]) => ({
      ...fetchData,
      data: fetchData.data?.filter(log => !this.isSelfCurrentAnswer(log, profile.groupId)),
    }))
  );

  readonly columns$ = combineLatest([
    this.item$.pipe(distinctUntilChanged()),
    this.watchedGroup$,
  ]).pipe(
    map(([ item, watchedGroup ]) => this.getLogColumns(item.type, watchedGroup)),
  );

  isWatching$ = this.groupWatchingService.isWatching$;
  canWatchAnswers$ = this.item$.pipe(
    map(item => allowsWatchingAnswers(item.permissions))
  );

  constructor(
    private activityLogService: ActivityLogService,
    private groupWatchingService: GroupWatchingService,
    private sessionService: UserSessionService,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  ngOnInit(): void{
    this.resetRows();
  }

  ngOnChanges(): void {
    if (!this.itemData) {
      return;
    }

    this.item$.next(this.itemData.item);
  }

  ngOnDestroy(): void {
    this.item$.complete();
  }

  refresh(): void {
    this.resetRows();
  }

  getRows(pageSize: number, latestRow?: ActivityLog): Observable<ActivityLog[]> {
    return this.watchedGroup$.pipe(

      switchMap(watchedGroup => {
        const paginationParams = latestRow === undefined ? undefined : {
          fromItemId: latestRow.item.id,
          fromParticipantId: latestRow.participant.id,
          fromAttemptId: latestRow.attemptId,
          fromAnswerId: latestRow.answerId ?? '0',
          fromActivityType: latestRow.activityType,
        };

        return this.activityLogService.getActivityLog(
          this.itemData?.item.id ?? '', {
            limit: pageSize,
            pagination: paginationParams,
            watchedGroupId: watchedGroup?.route.id,
          }
        );
      }),
    );
  }

  resetRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }


  private isSelfCurrentAnswer(log: ActivityLog, profileId: string): boolean {
    return log.activityType === 'current_answer' && log.participant.id === profileId;
  }

  private getLogColumns(type: ItemType, watchingGroup: WatchedGroup|null): Column[] {
    const columns = [
      {
        field: 'activityType',
        header: $localize`Action`,
        enabled: true,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
        enabled: type !== 'Task',
      },
      {
        field: 'item.user',
        header: $localize`User`,
        enabled: watchingGroup && !watchingGroup.route.isUser,
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
