import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { ItemType } from 'src/app/models/item-type';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { allowsWatchingAnswers } from 'src/app/models/item-watch-permission';
import { DataPager } from 'src/app/utils/data-pager';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LogActionDisplayPipe } from 'src/app/pipes/logActionDisplay';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe, ItemRouteWithAnswerPipe, ContentTypeFromItemPipe } from 'src/app/pipes/itemRoute';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LetDirective } from '@ngrx/component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgClass, NgSwitchDefault, AsyncPipe, DatePipe, I18nSelectPipe } from '@angular/common';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';
interface Column {
  field: string,
  header: string,
}

const logsLimit = 20;

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    LetDirective,
    ButtonModule,
    RouterLink,
    TableModule,
    SharedModule,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    ScoreRingComponent,
    NgClass,
    NgSwitchDefault,
    AsyncPipe,
    DatePipe,
    I18nSelectPipe,
    RawItemRoutePipe,
    ItemRouteWithAnswerPipe,
    ContentTypeFromItemPipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    RelativeTimeComponent,
  ],
})
export class ItemLogViewComponent implements OnChanges, OnDestroy, OnInit {

  @Input() itemData?: ItemData;

  observedGroupId$ = this.store.select(fromObservation.selectObservedGroupId);
  isObserving$ = this.store.select(fromObservation.selectIsObserving);

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> => this.getRows(pageSize, latestRow),
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
    this.store.select(fromObservation.selectObservedGroupRoute),
  ]).pipe(
    map(([ item, observedGroupRoute ]) => this.getLogColumns(item.type, observedGroupRoute)),
  );

  canWatchAnswers$ = this.item$.pipe(
    map(item => allowsWatchingAnswers(item.permissions))
  );

  constructor(
    private store: Store,
    private activityLogService: ActivityLogService,
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

  getRows(pageSize: number, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> {
    return this.store.select(fromObservation.selectObservedGroupId).pipe(

      switchMap(observedGroupId => {
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
            watchedGroupId: observedGroupId ?? undefined,
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


  private isSelfCurrentAnswer(log: ActivityLogs[number], profileId: string): boolean {
    return log.activityType === 'current_answer' && log.participant.id === profileId;
  }

  private getLogColumns(type: ItemType, observedGroupRoute: RawGroupRoute|null): Column[] {
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
        enabled: observedGroupRoute && !isUser(observedGroupRoute),
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
