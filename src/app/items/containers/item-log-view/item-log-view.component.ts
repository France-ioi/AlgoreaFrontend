import { Component, computed, DestroyRef, effect, input, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, switchMap, map, catchError, take } from 'rxjs/operators';
import { ItemType } from 'src/app/items/models/item-type';
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
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';
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
import { errorState, FetchState, fetchingState, mapStateData, readyState } from 'src/app/utils/state';
import { HistoryListCheckpointRow, HistoryListRow, mergeEventsAndCheckpoints } from './history-list-merge';
import {
  attemptNumberForLabel, HistoryViewMode, historyModeOptions,
  initialHistoryViewMode, shouldShowHistoryModeSelection,
} from './history-view-mode';

interface Column {
  field: string,
  header: string,
}

const logsLimit = 20;

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
  /**
   * Identity of the History list context. Includes loaded-task fingerprint so the default mode
   * rebinds when the iframe becomes ready on this attempt (without latching forever).
   */
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
    pageSize: logsLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  private readonly item$ = toObservable(this.itemData).pipe(map(itemData => itemData.item));
  private readonly eventsListState = toSignal(
    combineLatest([ this.datapager.list$, this.sessionService.userProfile$ ]).pipe(
      map(([ fetchData, profile ]) => mapStateData(fetchData, (logs): HistoryListRow[] =>
        logs
          .filter(log => !this.isSelfCurrentAnswer(log, profile.groupId))
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
  ]).pipe(map(([ item, observedGroupRoute ]) => this.getLogColumns(item.type, observedGroupRoute)));
  columns = toSignal(this.columns$, { initialValue: [] as Column[] });
  displayedColumns = computed(() => this.columns().map(column => column.field));

  constructor() {
    this.destroyRef.onDestroy(() => {
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
      switchMap(() => this.fetchEventsAndEdits()),
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

  checkpointCaption(row: HistoryListCheckpointRow): string {
    const { tags, activeTab, sinceEarlierCheckpoint, sinceEarlier } = row.checkpoint;
    const tag = tags.map(t => t.i18nText ?? t.identifier).filter(Boolean).join(', ') || $localize`Checkpoint`;
    const file = activeTab.name ?? $localize`Untitled`;
    const delta = sinceEarlierCheckpoint ?? sinceEarlier;
    return $localize`${tag}:tag: · ${activeTab.progLang}:lang: · ${file}:file: · +${
      delta.charsAdded
    }:added:/−${delta.charsRemoved}:removed:`;
  }

  private fetchEventsAndEdits(): Observable<FetchState<HistoryListRow[]>> {
    const attemptId = this.itemData().route.attemptId;
    const loaded = this.loadedTask();
    const previous = this.editsState().data;
    this.editsState.set(fetchingState(previous));

    // Only called when Events & Edits is selected; selection requires a matching loaded task.
    if (!loaded || loaded.savesEditorHistory !== true || loaded.attemptId !== attemptId) {
      return of(readyState([]));
    }

    const events$ = this.store.select(fromObservation.selectObservedGroupId).pipe(
      take(1),
      switchMap(observedGroupId => this.activityLogService.getActivityLog(this.itemData().item.id, {
        limit: logsLimit,
        watchedGroupId: observedGroupId ?? undefined,
        attemptId,
      })),
    );

    return forkJoin({
      events: events$,
      checkpoints: loaded.task.getHistory({ onlyCheckpoints: true }),
      profile: this.sessionService.userProfile$.pipe(take(1)),
    }).pipe(
      map(({ events, checkpoints, profile }) => readyState(mergeEventsAndCheckpoints(
        events.filter(log => !this.isSelfCurrentAnswer(log, profile.groupId)),
        checkpoints,
      ))),
      catchError(err => of(errorState(err))),
    );
  }

  private isSelfCurrentAnswer(log: ActivityLogs[number], profileId: string): boolean {
    return log.activityType === 'current_answer' && log.participant.id === profileId;
  }

  private getLogColumns(type: ItemType, observedGroupRoute: RawGroupRoute|null): Column[] {
    return [
      { field: 'activityType', header: $localize`Action`, enabled: true },
      { field: 'item.string.title', header: $localize`Content`, enabled: type !== 'Task' },
      { field: 'item.user', header: $localize`User`, enabled: !!(observedGroupRoute && !isUser(observedGroupRoute)) },
      { field: 'at', header: $localize`Time`, enabled: true },
    ].filter(item => item.enabled).map(({ field, header }) => ({ field, header }));
  }
}
