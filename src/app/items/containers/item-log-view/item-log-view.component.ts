import { Component, computed, DestroyRef, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { ItemType } from 'src/app/items/models/item-type';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DataPager } from 'src/app/utils/data-pager';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LogActionDisplayPipe } from 'src/app/pipes/logActionDisplay';
import { UserLinkWithActionsComponent } from 'src/app/ui-components/user-link-with-actions/user-link-with-actions.component';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { Router, RouterLink } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRouteWith } from 'src/app/models/routing/item-route';
import { UrlTree } from '@angular/router';
import { LogActivityTypeIconPipe } from 'src/app/pipes/logActivityTypeIcon';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { BackLinkBarComponent } from 'src/app/ui-components/back-link-bar/back-link-bar.component';
import { fromItemContent } from 'src/app/items/store';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRow,
  CdkRowDef,
  CdkTable,
} from '@angular/cdk/table';
import { toSignal } from '@angular/core/rxjs-interop';
interface Column {
  field: string,
  header: string,
}

const logsLimit = 20;

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    LetDirective,
    RouterLink,
    ScoreRingComponent,
    NgClass,
    AsyncPipe,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    UserLinkWithActionsComponent,
    LogActionDisplayPipe,
    RelativeTimeComponent,
    LogActivityTypeIconPipe,
    ButtonComponent,
    BackLinkBarComponent,
    CdkTable,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkCellDef,
    CdkCell,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
  ]
})
export class ItemLogViewComponent implements OnChanges, OnDestroy, OnInit {
  private store = inject(Store);
  private activityLogService = inject(ActivityLogService);
  private sessionService = inject(UserSessionService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private router = inject(Router);
  private itemRouter = inject(ItemRouter);

  constructor() {
    // Clear the back-link state when leaving the destination page via any
    // mechanism (back-link button, browser back, in-page tab change). The
    // store-level effect only clears on item changes; this catches the case
    // where the user navigates *away* without changing the active item.
    inject(DestroyRef).onDestroy(() => {
      this.store.dispatch(fromItemContent.backLinkActions.clear());
    });
  }

  @Input() itemData?: ItemData;

  observedGroupId$ = this.store.select(fromObservation.selectObservedGroupId);
  isObserving$ = this.store.select(fromObservation.selectIsObserving);

  readonly backLink = this.store.selectSignal(fromItemContent.selectBackLink);
  readonly observedGroupInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  readonly backLinkHeading = computed(() => {
    const backLink = this.backLink();
    const obs = this.observedGroupInfo();
    if (!backLink || !obs) return null;
    return isUser(obs.route)
      ? $localize`You are now on the history page of user ${obs.name}.`
      : $localize`You are now on the history page of group ${obs.name}.`;
  });

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

  columns = toSignal(this.columns$, { initialValue: [] });
  displayedColumns = computed(() => this.columns().map(column => column.field));

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

  onViewAnswer(): void {
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: $localize`Back to the history page`,
      },
    }));
  }

  onBackLinkClick(url: string): void {
    void this.router.navigateByUrl(url);
  }

  getObserveLink(user: { id: string }): UrlTree | undefined {
    if (!this.itemData) return undefined;
    return this.itemRouter.url(itemRouteWith(this.itemData.route, { observedGroup: { id: user.id, isUser: true } }));
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
