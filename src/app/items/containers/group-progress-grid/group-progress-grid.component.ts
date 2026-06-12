import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, shareReplay, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { canCurrentUserGrantGroupAccess } from 'src/app/groups/models/group-management';
import { Group } from 'src/app/groups/models/group';
import { GetGroupChildrenService } from 'src/app/groups/data-access/get-group-children.service';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { GetGroupProgressService } from 'src/app/data-access/get-group-progress.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { TypeFilter } from '../../models/composition-filter';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { ProgressData, UserProgressDetailsComponent } from '../../containers/user-progress-details/user-progress-details.component';
import { DataPager } from 'src/app/utils/data-pager';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { allowsGivingPermToItem } from 'src/app/items/models/item-permissions';
import { itemRoute, itemRouteWith } from 'src/app/models/routing/item-route';
import { selectObservedGroupRouteAsItemRouteParameter } from 'src/app/models/routing/item-route-observation-selector';
import { Store } from '@ngrx/store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import {
  PermissionsEditDialogComponent,
  PermissionsEditDialogParams,
} from '../../containers/permissions-edit-dialog/permissions-edit-dialog.component';
import { UserProgressComponent } from '../../containers/user-progress/user-progress.component';
import { RouterLink } from '@angular/router';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AsyncPipe } from '@angular/common';
import { CompositionFilterComponent } from '../../containers/composition-filter/composition-filter.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { Dialog } from '@angular/cdk/dialog';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { UserLinkWithActionsComponent } from 'src/app/ui-components/user-link-with-actions/user-link-with-actions.component';
import { UrlTree } from '@angular/router';
import { typeCategoryOfItem } from 'src/app/items/models/item-type';
import { RawGroupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { getGroupProgressGridColumns } from './group-progress-grid-columns';
import { groupProgressDetailMenuPositions } from './group-progress-grid-menu-positions';
import { getRowsWithProgress } from './group-progress-grid-data';
import { GroupProgressGridCsvExportService } from './group-progress-grid-csv-export.service';
import {
  DataColumn,
  DataRow,
  ProgressDataDialog,
} from './group-progress-grid.types';

export type { Progress } from './group-progress-grid.types';

@Component({
  selector: 'alg-group-progress-grid',
  templateUrl: './group-progress-grid.component.html',
  styleUrls: [ './group-progress-grid.component.scss' ],
  providers: [ GroupProgressGridCsvExportService ],
  imports: [
    CompositionFilterComponent,
    ErrorComponent,
    LoadingComponent,
    UserProgressDetailsComponent,
    RouterLink,
    UserProgressComponent,
    AsyncPipe,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    GroupLinkPipe,
    ButtonComponent,
    ButtonIconComponent,
    CdkMenuTrigger,
    CdkMenu,
    TooltipDirective,
    UserLinkWithActionsComponent,
  ]
})
export class GroupProgressGridComponent {
  private getItemChildrenService = inject(GetItemChildrenService);
  private getGroupDescendantsService = inject(GetGroupDescendantsService);
  private getGroupUsersProgressService = inject(GetGroupProgressService);
  private getGroupChildrenService = inject(GetGroupChildrenService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private csvExportService = inject(GroupProgressGridCsvExportService);
  private store = inject(Store);
  private observedGroupRouteParam = this.store.selectSignal(selectObservedGroupRouteAsItemRouteParameter);
  private itemRouter = inject(ItemRouter);
  private dialogService = inject(Dialog);
  private destroyRef = inject(DestroyRef);

  readonly group = input.required<Group>();
  readonly itemData = input.required<ItemData>();

  defaultFilter: TypeFilter = 'Users';

  readonly currentFilter = signal<TypeFilter>(this.defaultFilter);
  readonly progressOverlay = signal<ProgressData | undefined>(undefined);
  readonly activeCell = signal<{ rowId: string, colIndex: number } | null>(null);
  readonly progressDataDialog = signal<ProgressDataDialog | undefined>(undefined);
  readonly sourceGroup = signal<RawGroupRoute | undefined>(undefined);
  private readonly isRefreshing = signal(false);

  readonly canAccess = computed(() =>
    canCurrentUserGrantGroupAccess(this.group())
    && allowsGivingPermToItem(this.itemData().item.permissions)
  );

  readonly isCSVDataFetching = this.csvExportService.isFetching;

  private readonly refresh$ = new Subject<void>();
  // columns containing results, including the first "chapter summary" one
  readonly columns$: Observable<FetchState<DataColumn[]>> = toObservable(this.itemData).pipe(
    switchMap(itemData => getGroupProgressGridColumns(this.getItemChildrenService, itemData)),
    mapToFetchState({ resetter: this.refresh$ }),
    shareReplay(1),
  );

  private pageSizesForFilter(filter: TypeFilter): { default: number, max: number } {
    return this.getGroupUsersProgressService.pageSizes[filter.toLowerCase() as Lowercase<TypeFilter>];
  }

  readonly datapager = new DataPager<DataRow>({
    pageSize: this.pageSizesForFilter(this.defaultFilter).default,
    maxPageSize: this.pageSizesForFilter(this.defaultFilter).max,
    fetch: (pageSize, latestRow?: DataRow): Observable<DataRow[]> => {
      const group = this.group();
      const itemData = this.itemData();
      return getRowsWithProgress(
        this.getGroupDescendantsService,
        this.getGroupChildrenService,
        this.getGroupUsersProgressService,
        this.columns$.pipe(readyData()),
        {
          groupId: group.id,
          itemId: itemData.item.id,
          filter: this.currentFilter(),
          fromId: latestRow?.id,
          pageSize,
        },
      );
    },
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
  });

  rows$ = this.datapager.list$;

  readonly progressDetailMenuPositions = groupProgressDetailMenuPositions;

  constructor() {
    combineLatest([
      toObservable(this.group),
      toObservable(this.itemData),
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ group ]) => {
        this.fetchRows();
        this.sourceGroup.set(rawGroupRoute(group));
      });

    this.rows$.pipe(
      filter(() => this.isRefreshing()),
      filter(state => state.isReady || state.isError),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(state => {
      this.isRefreshing.set(false);
      if (state.isReady) {
        this.actionFeedbackService.success($localize`Data refreshed successfully`);
      }
    });

    this.destroyRef.onDestroy(() => this.refresh$.complete());
  }

  showProgressDetail(row: DataRow, col: DataColumn, colIndex: number): void {
    const progress = row.data[colIndex];
    if (!progress) throw new Error('Unexpected: progress data is missing');
    this.activeCell.set({ rowId: row.id, colIndex });
    const itemData = this.itemData();
    const group = this.group();
    const attemptId = itemData.currentResult?.attemptId;
    if (!attemptId) throw new Error('Unexpected: Children have been loaded, so we are sure this item has an attempt');
    this.progressOverlay.set({
      progress,
      colItem: {
        type: col.type,
        fullRoute: itemRoute(
          typeCategoryOfItem(col),
          col.id,
          {
            path: [ ...itemData.route.path, ...(col.id !== itemData.route.id ? [ itemData.route.id ] : []) ],
            ...col.id === itemData.route.id ? {
              attemptId,
            } : {
              parentAttemptId: attemptId,
            },
            ...this.observedGroupRouteParam(),
          }
        ),
        permissions: col.permissions,
      },
      rowGroup: {
        id: row.id,
        isUser: this.currentFilter() === 'Users',
      },
    });
    this.progressDataDialog.set({
      item: {
        id: col.id,
        requiresExplicitEntry: col.requiresExplicitEntry,
        string: {
          title: col.title,
        },
      },
      group: rawGroupRoute({ id: row.id, isUser: this.currentFilter() === 'Users' }),
      groupName: row.header,
      sourceGroupName: group.name,
    });
  }

  hideProgressDetail(): void {
    this.progressOverlay.set(undefined);
    this.activeCell.set(null);
  }

  fetchRows(): void {
    this.datapager.reset();
    this.refresh$.next(); // refreshes the columns.
    this.fetchMoreRows();
  }

  onFilterChange(typeFilter: TypeFilter): void {
    if (typeFilter !== this.currentFilter()) {
      this.currentFilter.set(typeFilter);
      const sizes = this.pageSizesForFilter(typeFilter);
      this.datapager.setPageSize(sizes.default, sizes.max);
      this.fetchRows();
    }
  }

  refreshRows(): void {
    this.isRefreshing.set(true);
    this.datapager.refresh();
    this.refresh$.next();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }

  onAccessPermissions(): void {
    this.hideProgressDetail();
    const progressDataDialog = this.progressDataDialog();
    if (!progressDataDialog) throw new Error('Unexpected: progress data dialog');
    const sourceGroup = this.sourceGroup();
    if (!sourceGroup) throw new Error('Unexpected: missed source group');
    this.dialogService.open<boolean, PermissionsEditDialogParams>(PermissionsEditDialogComponent, {
      data: {
        currentUserPermissions: this.itemData().item.permissions,
        item: progressDataDialog.item,
        group: progressDataDialog.group,
        sourceGroup,
        permReceiverName: progressDataDialog.groupName,
        permGiverName: progressDataDialog.sourceGroupName,
      },
      disableClose: true,
    }).closed.subscribe(() => {
      this.progressDataDialog.set(undefined);
    });
  }

  getObserveLink(row: DataRow): UrlTree | undefined {
    if (!row.user) return undefined;
    return this.itemRouter.url(itemRouteWith(this.itemData().route, { observedGroup: { id: row.id, isUser: true } }));
  }

  onCSVExport(): void {
    const group = this.group();
    const itemData = this.itemData();
    this.csvExportService.export(group.id, itemData.item.id, this.currentFilter());
  }
}
