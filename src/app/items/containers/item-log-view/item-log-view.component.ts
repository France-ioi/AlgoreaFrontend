import { Component, computed, DestroyRef, effect, input, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DataPager } from 'src/app/utils/data-pager';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LogActionDisplayPipe } from 'src/app/pipes/logActionDisplay';
import { UserLinkWithActionsComponent } from 'src/app/ui-components/user-link-with-actions/user-link-with-actions.component';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { Router, RouterLink, UrlTree } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { isUser } from 'src/app/models/routing/group-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRouteWith } from 'src/app/models/routing/item-route';
import { LogActivityTypeIconPipe } from 'src/app/pipes/logActivityTypeIcon';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { BackLinkBarComponent } from 'src/app/ui-components/back-link-bar/back-link-bar.component';
import { fromItemContent } from 'src/app/items/store';
import {
  CdkCell, CdkCellDef, CdkColumnDef, CdkHeaderCell, CdkHeaderCellDef,
  CdkHeaderRow, CdkHeaderRowDef, CdkNoDataRow, CdkRow, CdkRowDef, CdkTable,
} from '@angular/cdk/table';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { ItemLoadedTaskRegistry } from '../../services/item-loaded-task-registry';
import { FetchState, fetchingState, mapStateData } from 'src/app/utils/state';
import { HistoryListRow } from './history-list-merge';
import { checkpointCaption } from './history-checkpoint-caption';
import { HistoryEditsFacade } from './history-edits-facade';
import { fetchAttemptActivityLog$ } from './history-edits-load';
import { historyEditsPageSize } from './history-edits-pager';
import { HistoryLogColumn, historyLogColumns } from './history-log-columns';
import {
  attemptNumberForLabel, HistoryViewMode, historyModeOptions,
  initialHistoryViewMode, shouldShowHistoryModeSelection,
} from './history-view-mode';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrl: './item-log-view.component.scss',
  imports: [
    LoadingComponent, ErrorComponent, RouterLink, ScoreRingComponent, AsyncPipe,
    ItemRoutePipe, ItemRouteWithExtraPipe, RouteUrlPipe, UserLinkWithActionsComponent,
    LogActionDisplayPipe, RelativeTimeComponent, LogActivityTypeIconPipe, ButtonComponent,
    BackLinkBarComponent, SelectionComponent, CdkTable, CdkColumnDef, CdkHeaderCell,
    CdkHeaderCellDef, CdkCellDef, CdkCell, CdkHeaderRow, CdkHeaderRowDef, CdkRow, CdkRowDef, CdkNoDataRow,
  ]
})
export class ItemLogViewComponent {
  private store = inject(Store);
  private activityLogService = inject(ActivityLogService);
  private sessionService = inject(UserSessionService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private router = inject(Router);
  private itemRouter = inject(ItemRouter);
  private loadedTaskRegistry = inject(ItemLoadedTaskRegistry, { optional: true });
  private destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();

  observedGroupId$ = this.store.select(fromObservation.selectObservedGroupId);
  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
  observedGroupRoute = this.store.selectSignal(fromObservation.selectObservedGroupRoute);
  readonly backLink = this.store.selectSignal(fromItemContent.selectBackLink);
  readonly observedGroupInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  readonly backLinkHeading = computed(() => {
    const obs = this.observedGroupInfo();
    if (!obs) return '';
    return isUser(obs.route)
      ? $localize`You are now on the history page of user ${obs.name}.`
      : $localize`You are now on the history page of group ${obs.name}.`;
  });

  private readonly loadedTask$ = this.loadedTaskRegistry?.snapshot$ ?? of(null);
  readonly loadedTask = toSignal(this.loadedTask$, { initialValue: null });

  readonly mode = signal<HistoryViewMode>('events');
  private readonly editsReload$ = new Subject<void>();
  readonly editsState = signal<FetchState<HistoryListRow[]>>(fetchingState());
  readonly editsCanLoadMore = signal(false);
  private readonly editsFacade = new HistoryEditsFacade(
    state => this.editsState.set(state),
    canLoadMore => this.editsCanLoadMore.set(canLoadMore),
    () => this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`),
    this.sessionService.userProfile$.pipe(map(profile => profile.groupId)),
    (attemptId, latest) => fetchAttemptActivityLog$(
      this.activityLogService,
      this.itemData().item.id,
      attemptId,
      this.store.select(fromObservation.selectObservedGroupId),
      latest,
    ),
  );
  /** Includes loaded-task fingerprint so default mode rebinds when the iframe becomes ready. */
  private readonly historyContextKey = computed(() => {
    const data = this.itemData();
    const observed = this.observedGroupRoute();
    const loaded = this.loadedTask();
    return [
      data.item.id,
      data.route.attemptId ?? '',
      this.isObserving() ? '1' : '0',
      observed?.id ?? '',
      loaded?.attemptId ?? '',
      loaded?.savesEditorHistory === true ? '1' : loaded?.savesEditorHistory === false ? '0' : 'u',
    ].join('|');
  });

  readonly showModeSelection = computed(() =>
    shouldShowHistoryModeSelection(
      this.itemData().item.type,
      this.observedGroupRoute(),
      this.isObserving(),
      this.itemData().route.attemptId,
      this.loadedTask(),
    )
  );
  readonly modeOptions = computed(() =>
    historyModeOptions(attemptNumberForLabel(this.itemData().results, this.itemData().route.attemptId))
  );
  readonly selectedModeIndex = computed(() => {
    const index = this.modeOptions().findIndex(option => option.value === this.mode());
    return index >= 0 ? index : 0;
  });

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> => this.getRows(pageSize, latestRow),
    pageSize: historyEditsPageSize,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  private readonly item$ = toObservable(this.itemData).pipe(map(itemData => itemData.item));
  private readonly eventsListState = toSignal(
    combineLatest([ this.datapager.list$, this.sessionService.userProfile$ ]).pipe(
      map(([ fetchData, profile ]) => mapStateData(fetchData, (logs): HistoryListRow[] =>
        logs
          .filter(log => !(log.activityType === 'current_answer' && log.participant.id === profile.groupId))
          .map(event => ({ kind: 'event' as const, at: event.at, event })),
      )),
    ),
    { initialValue: fetchingState<HistoryListRow[]>() },
  );

  readonly listState = computed((): FetchState<HistoryListRow[]> => {
    if (this.mode() === 'events_and_edits') return this.editsState();
    return this.eventsListState();
  });

  readonly columns$ = combineLatest([
    this.item$.pipe(distinctUntilChanged()),
    this.store.select(fromObservation.selectObservedGroupRoute),
  ]).pipe(map(([ item, observedGroupRoute ]) => historyLogColumns(item.type, observedGroupRoute)));
  columns = toSignal(this.columns$, { initialValue: [] as HistoryLogColumn[] });
  displayedColumns = computed(() => this.columns().map(column => column.field));

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.editsFacade.destroy();
      this.store.dispatch(fromItemContent.backLinkActions.clear());
      this.editsReload$.complete();
    });

    effect(() => {
      const contextKey = this.historyContextKey();
      const isObserving = this.isObserving();
      const loaded = this.loadedTask();
      const attemptId = this.itemData().route.attemptId;
      untracked(() => {
        void contextKey;
        const nextMode = initialHistoryViewMode(isObserving, attemptId, loaded);
        this.mode.set(nextMode);
        if (nextMode === 'events') this.resetRows();
        else this.editsReload$.next();
      });
    });

    this.editsReload$.pipe(
      switchMap(() => {
        const loaded = this.loadedTask();
        const previous = this.editsState().data;
        this.editsState.set(fetchingState(previous));
        return this.editsFacade.reload(
          loaded?.task,
          this.itemData().route.attemptId,
          loaded?.savesEditorHistory,
          loaded?.attemptId,
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(state => this.editsState.set(state));
  }

  refresh(): void {
    if (this.mode() === 'events_and_edits') this.editsReload$.next();
    else this.resetRows();
  }

  onModeChange(index: number): void {
    const option = this.modeOptions()[index];
    if (!option || option.value === this.mode()) return;
    this.mode.set(option.value);
    if (option.value === 'events') this.resetRows();
    else this.editsReload$.next();
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
        return this.activityLogService.getActivityLog(this.itemData().item.id, {
          limit: pageSize,
          pagination: paginationParams,
          watchedGroupId: observedGroupId ?? undefined,
        });
      }),
    );
  }

  resetRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    if (this.mode() === 'events_and_edits') {
      const loaded = this.loadedTask();
      this.editsFacade.loadMore(
        this.editsState().isFetching,
        this.editsState().data,
        loaded?.task,
        this.itemData().route.attemptId,
      );
      return;
    }
    this.datapager.load();
  }

  onViewAnswer(): void {
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: { url: this.router.url, label: $localize`Back to the history page` },
    }));
  }

  onBackLinkClick(url: string): void {
    void this.router.navigateByUrl(url);
  }

  getObserveLink(user: { id: string }): UrlTree | undefined {
    return this.itemRouter.url(itemRouteWith(this.itemData().route, { observedGroup: { id: user.id, isUser: true } }));
  }

  readonly checkpointCaption = checkpointCaption;
}
