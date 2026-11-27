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
import { activityRowMark } from 'src/app/pipes/activityRowMark';
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
import { HistoryListRow, activityLogsToEventRows } from './history-list-merge';
import { checkpointCaption, editCaption } from './history-checkpoint-caption';
import { editSpanLine, HistoryDisplayRow, insertExpandedEdits } from './history-list-edits';
import { HistoryCheckpointExpansion } from './history-checkpoint-expansion';
import { HistoryModeActions, HistoryModeMemory, chooseHistoryMode, followHistoryMode } from './history-mode-sync';
import { HistoryEditsFacade } from './history-edits-facade';
import { fetchAllActivityLog, fetchAttemptActivityLog$ } from './history-edits-load';
import { historyEditsPageSize } from './history-edits-pager';
import { HistoryLogColumn, historyLogColumns } from './history-log-columns';
import {
  attemptNumberForLabel, HistoryViewMode, historyModeOptions, isObservingGroup,
  newestActivityLogAttemptId, observerEditsAttemptId,
  shouldShowHistoryModeSelection,
} from './history-view-mode';
import { HistoryTaskLoadRequest, historyTaskLoadFor } from '../../services/history-task-load.request';
import { HistoryRestoreRequest } from '../../services/history-restore.request';
import { HistoryModeChoice } from '../../services/history-mode-choice';
import { canCurrentUserWatchAnswers } from 'src/app/items/models/item-watch-permission';
import { opensTaskReadOnly } from 'src/app/items/models/task-read-only';
import { areSubmissionsClosedFor } from 'src/app/items/models/attempts';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrl: './item-log-view.component.scss',
  imports: [
    LoadingComponent, ErrorComponent, RouterLink, ScoreRingComponent, AsyncPipe,
    ItemRoutePipe, ItemRouteWithExtraPipe, RouteUrlPipe, UserLinkWithActionsComponent,
    LogActionDisplayPipe, RelativeTimeComponent, ButtonComponent,
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
  private historyTaskLoad = inject(HistoryTaskLoadRequest, { optional: true });
  private restoreRequest = inject(HistoryRestoreRequest, { optional: true });
  private modeChoice = inject(HistoryModeChoice, { optional: true }) ?? new HistoryModeChoice();
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
  private readonly modeMemory: HistoryModeMemory = {
    userChoseEventsOnly: false,
    seenNavigationKey: '',
    pendingEditsLoad: false,
    awaitingEditsAttempt: false,
  };
  readonly expansion = new HistoryCheckpointExpansion();
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
  private readonly navigationKey = computed(() => {
    const data = this.itemData();
    const observed = this.observedGroupRoute();
    return [ data.item.id, data.route.attemptId ?? '', this.isObserving() ? '1' : '0', observed?.id ?? '' ].join('|');
  });

  /**
   * Observed user id when watching one user; null otherwise (own History or group).
   * Prefer the item route (URL `og`/`ou`) so Events & Edits can load before observation info fetches.
   */
  private readonly observedUserId = computed((): string | null => {
    const fromItem = this.itemData().route.observedGroup;
    if (fromItem?.isUser) return fromItem.id;
    const route = this.observedGroupRoute();
    return route && isUser(route) ? route.id : null;
  });

  /** Group/user under observation for History mode visibility (item route first). */
  private readonly observedGroupForMode = computed(() =>
    this.itemData().route.observedGroup ?? this.observedGroupRoute()
  );
  private readonly observingGroup = computed(() => isObservingGroup(this.observedGroupForMode()));

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> =>
      fetchAllActivityLog(
        this.activityLogService,
        this.itemData().item.id,
        this.store.select(fromObservation.selectObservedGroupId),
        pageSize,
        latestRow,
      ),
    pageSize: historyEditsPageSize,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  private readonly item$ = toObservable(this.itemData).pipe(map(itemData => itemData.item));
  private readonly eventsListState = toSignal(
    combineLatest([ this.datapager.list$, this.sessionService.userProfile$ ]).pipe(
      map(([ fetchData, profile ]) => mapStateData(fetchData, logs => activityLogsToEventRows(logs, profile.groupId))),
    ),
    { initialValue: fetchingState<HistoryListRow[]>() },
  );

  /**
   * Attempt whose editor history the Events & Edits option refers to.
   * Own: URL attempt. Observer: loaded observed task, else newest activity-log row.
   */
  readonly editsAttemptId = computed((): string | undefined => {
    const observedUserId = this.observedUserId();
    if (!observedUserId) return this.itemData().route.attemptId;
    const logRows = this.eventsListState().data ?? [];
    return observerEditsAttemptId(
      this.loadedTask(),
      observedUserId,
      newestActivityLogAttemptId(logRows),
    );
  });

  /** Whether a checkpoint/history-element button opens the task read-only ("Show") rather than editable ("Restore"). */
  readonly restoreOpensReadOnly = computed(() => {
    // Opening from History always clears the route's answer. Own History loads the URL attempt (the current result).
    const submissionsClosed = areSubmissionsClosedFor(this.itemData().currentResult);
    return opensTaskReadOnly({}, historyTaskLoadFor(this.editsAttemptId() ?? '', this.observedUserId()), submissionsClosed);
  });

  readonly showModeSelection = computed(() =>
    shouldShowHistoryModeSelection(
      this.itemData().item.type,
      this.observedGroupForMode(),
      canCurrentUserWatchAnswers(this.itemData().item),
      this.editsAttemptId(),
      this.loadedTask(),
    )
  );
  readonly modeOptions = computed(() =>
    historyModeOptions(attemptNumberForLabel(this.itemData().results, this.editsAttemptId()))
  );
  readonly selectedModeIndex = computed(() =>
    Math.max(this.modeOptions().findIndex(option => option.value === this.mode()), 0)
  );

  readonly listState = computed((): FetchState<HistoryListRow[]> => {
    if (this.mode() === 'events_and_edits') return this.editsState();
    return this.eventsListState();
  });

  readonly displayedRows = computed((): HistoryDisplayRow[] => {
    const rows = this.listState().data;
    if (!rows) return [];
    if (this.mode() !== 'events_and_edits') return rows;
    return insertExpandedEdits(rows, this.expansion.expandedEdits());
  });

  readonly editSpanMarks = computed(() => editSpanLine(this.displayedRows()));

  readonly columns$ = combineLatest([
    this.item$.pipe(distinctUntilChanged()),
    this.store.select(fromObservation.selectObservedGroupRoute),
  ]).pipe(map(([ item, observedGroupRoute ]) => historyLogColumns(item.type, observedGroupRoute)));
  columns = toSignal(this.columns$, { initialValue: [] as HistoryLogColumn[] });
  displayedColumns = computed(() => {
    const fields = this.columns().map(column => column.field);
    return this.mode() === 'events_and_edits' ? [ 'edits', ...fields ] : fields;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.editsFacade.destroy();
      this.store.dispatch(fromItemContent.backLinkActions.clear());
      this.editsReload$.complete();
    });

    effect(() => {
      const nav = this.navigationKey();
      const loaded = this.loadedTask();
      const editsAttemptId = this.editsAttemptId();
      const observedUserId = this.observedUserId();
      const observingGroup = this.observingGroup();
      untracked(() => followHistoryMode(
        this.modeMemory,
        this.modeChoice,
        nav,
        editsAttemptId,
        loaded,
        observedUserId,
        observingGroup,
        this.mode(),
        this.modeActions(observedUserId),
      ));
    });

    this.editsReload$.pipe(
      switchMap(() => {
        const loaded = this.loadedTask();
        const previous = this.editsState().data;
        this.editsState.set(fetchingState(previous));
        return this.editsFacade.reload(
          loaded?.task,
          this.editsAttemptId(),
          loaded?.savesEditorHistory,
          loaded?.attemptId,
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(state => this.editsState.set(state));
  }

  refresh(): void {
    this.expansion.clear();
    if (this.mode() === 'events_and_edits') this.editsReload$.next();
    else this.resetRows();
  }

  onModeChange(index: number): void {
    const option = this.modeOptions()[index];
    if (!option) return;
    const observedUserId = this.observedUserId();
    chooseHistoryMode(
      this.modeMemory,
      this.modeChoice,
      this.mode(),
      option.value,
      this.editsAttemptId(),
      this.loadedTask(),
      observedUserId,
      this.modeActions(observedUserId),
    );
  }

  toggleCheckpoint(row: HistoryListRow & { kind: 'checkpoint' }): void {
    this.expansion.toggle(row, this.loadedTask()?.task, this.editsState().data, this.destroyRef, () =>
      this.actionFeedbackService.error($localize`Could not load edits. Are you connected to the internet?`));
  }

  onRestore(elementId: number): void {
    const attemptId = this.editsAttemptId() ?? this.itemData().route.attemptId;
    if (!attemptId) return;
    const observedUserId = this.observedUserId();
    this.requestTaskLoad(attemptId, observedUserId);
    this.restoreRequest?.queue(elementId, attemptId);
    const route = this.itemData().route.attemptId === attemptId
      ? this.itemData().route
      : itemRouteWith(this.itemData().route, { attemptId });
    this.itemRouter.navigateTo(itemRouteWith(route, { answer: undefined }), {
      page: [ 'task', 'editor' ], useCurrentObservation: true,
    });
  }

  resetRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    if (this.mode() !== 'events_and_edits') {
      this.datapager.load();
      return;
    }
    const loaded = this.loadedTask();
    this.editsFacade.loadMore(
      this.editsState().isFetching, this.editsState().data, loaded?.task, this.editsAttemptId(),
    );
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
  readonly activityRowMark = activityRowMark;
  readonly editCaption = editCaption;

  private modeActions(observedUserId: string | null): HistoryModeActions {
    return {
      clearExpansions: () => this.expansion.clear(),
      applyMode: next => this.applyMode(next),
      showEditsLoading: (): void => {
        this.mode.set('events_and_edits');
        this.editsState.set(fetchingState());
      },
      loadTask: attemptId => this.requestTaskLoad(attemptId, observedUserId),
      reload: () => this.editsReload$.next(),
    };
  }

  private applyMode(next: HistoryViewMode): void {
    this.mode.set(next);
    if (next === 'events') this.resetRows();
    else this.editsReload$.next();
  }

  /**
   * Ask the item host to mount the attempt. When observing a user, load their attempt read-only
   * (observed-user token). Aligns the URL attempt first when it differs from the edits attempt.
   */
  private requestTaskLoad(attemptId: string, observedUserId: string | null): void {
    if (this.itemData().route.attemptId !== attemptId) {
      this.itemRouter.navigateTo(itemRouteWith(this.itemData().route, { attemptId }), {
        page: [ 'history' ],
        useCurrentObservation: true,
      });
    }
    this.historyTaskLoad?.request(historyTaskLoadFor(attemptId, observedUserId));
  }
}
