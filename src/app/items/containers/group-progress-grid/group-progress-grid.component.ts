import { Component, inject, Input, OnChanges, OnDestroy, signal, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, ReplaySubject, Subject } from 'rxjs';
import { combineLatestWith, map, shareReplay, switchMap } from 'rxjs/operators';
import { canCurrentUserGrantGroupAccess } from 'src/app/groups/models/group-management';
import { Group } from 'src/app/groups/models/group';
import { GetGroupChildrenService } from 'src/app/groups/data-access/get-group-children.service';
import { formatUser } from 'src/app/groups/models/user';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { GetGroupProgressService } from 'src/app/data-access/get-group-progress.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { TypeFilter } from '../../models/composition-filter';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { ProgressCSVService } from 'src/app/data-access/progress-csv.service';
import { downloadFile } from 'src/app/utils/download-file';
import { ItemType, typeCategoryOfItem } from 'src/app/items/models/item-type';
import { RawGroupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { ProgressData, UserProgressDetailsComponent } from '../../containers/user-progress-details/user-progress-details.component';
import { DataPager } from 'src/app/utils/data-pager';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { HttpErrorResponse } from '@angular/common/http';
import { allowsGivingPermToItem, ItemCorePerm } from 'src/app/items/models/item-permissions';
import { itemRoute } from 'src/app/models/routing/item-route';
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
import { NgIf, AsyncPipe } from '@angular/common';
import { CompositionFilterComponent } from '../../containers/composition-filter/composition-filter.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Dialog } from '@angular/cdk/dialog';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

const progressListLimit = 25;

export type Progress = {
  groupId: string,
  itemId: string,
  score: number,
  timeSpent: number,
  hintsRequested: number,
  submissions: number,
  latestActivityAt: Date | null,
} & ({
  type: 'user',
  validated: boolean,
} | {
  type: 'group',
  validationRate: number,
});


interface DataRow {
  header: string,
  id: string,
  data: (Progress|undefined)[],
}
interface DataColumn {
  id: string,
  requiresExplicitEntry: boolean,
  title: string|null,
  type: ItemType,
  permissions: ItemCorePerm,
}
interface DataFetching {
  groupId: string,
  itemId: string,
  filter: TypeFilter,
  fromId?: string,
  pageSize: number,
}

interface ProgressDataDialog {
  item: {
    id: string,
    requiresExplicitEntry: boolean,
    string: {
      title: string | null,
    },
  },
  group: RawGroupRoute,
  groupName: string,
  sourceGroupName: string,
}

@Component({
  selector: 'alg-group-progress-grid',
  templateUrl: './group-progress-grid.component.html',
  styleUrls: [ './group-progress-grid.component.scss' ],
  standalone: true,
  imports: [
    CompositionFilterComponent,
    NgIf,
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
  ],
})
export class GroupProgressGridComponent implements OnChanges, OnDestroy {

  @Input() group?: Group;
  @Input() itemData?: ItemData;

  private dialogService = inject(Dialog);

  defaultFilter: TypeFilter = 'Users';

  currentFilter = this.defaultFilter;

  progressOverlay?: ProgressData;
  progressDataDialog?: ProgressDataDialog;
  sourceGroup?: RawGroupRoute;

  isCSVDataFetching = false;
  canAccess = false;

  private itemData$ = new ReplaySubject<ItemData>(1);
  private refresh$ = new Subject<void>();
  // columns containing results, including the first "chapter summary" one
  readonly columns$: Observable<FetchState<DataColumn[]>> = this.itemData$.pipe(
    switchMap(itemData => this.getColumns(itemData)),
    mapToFetchState({ resetter: this.refresh$ }),
    shareReplay(1),
  );

  readonly datapager = new DataPager<DataRow>({
    pageSize: progressListLimit,
    fetch: (pageSize, latestRow?: DataRow): Observable<DataRow[]> => {
      if (!this.group || !this.itemData) throw new Error('properties are missing');
      return this.getRowsWithProgress({
        groupId: this.group.id,
        itemId: this.itemData.item.id,
        filter: this.currentFilter,
        fromId: latestRow?.id,
        pageSize,
      });
    },
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
  });

  rows$ = this.datapager.list$;

  progressDetailMenuPositions = signal<ConnectedPosition[]>([
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: 10,
      panelClass: [ 'alg-top-center-triangle', 'grey' ],
    },
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -40,
      panelClass: [ 'alg-bottom-center-triangle', 'grey' ],
    },
    {
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: -10,
      panelClass: [ 'alg-left-center-triangle', 'grey' ],
    },
  ]);

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private getGroupUsersProgressService: GetGroupProgressService,
    private getGroupChildrenService: GetGroupChildrenService,
    private actionFeedbackService: ActionFeedbackService,
    private progressCSVService: ProgressCSVService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.itemData && this.itemData) this.itemData$.next(this.itemData);
    if (this.group) {
      this.fetchRows();
      this.sourceGroup = rawGroupRoute(this.group);
    }
    this.canAccess = !!(this.group && canCurrentUserGrantGroupAccess(this.group)
      && this.itemData && allowsGivingPermToItem(this.itemData.item.permissions));
  }

  ngOnDestroy(): void {
    this.itemData$.complete();
    this.refresh$.complete();
  }

  showProgressDetail(userProgress: Progress, row: DataRow, col: DataColumn): void {
    if (!this.itemData) {
      throw new Error('Unexpected: Missed item data');
    }
    if (!this.group) {
      throw new Error('Unexpected: Missed group');
    }
    const attemptId = this.itemData.currentResult?.attemptId;
    if (!attemptId) throw new Error('Unexpected: Children have been loaded, so we are sure this item has an attempt');
    this.progressOverlay = {
      progress: userProgress,
      colItem: {
        type: col.type,
        fullRoute: itemRoute(
          typeCategoryOfItem(col),
          col.id,
          {
            path: [ ...this.itemData.route.path, ...(col.id !== this.itemData.route.id ? [ this.itemData.route.id ] : []) ],
            ...col.id === this.itemData.route.id ? {
              attemptId,
            } : {
              parentAttemptId: attemptId,
            }
          }
        ),
        permissions: col.permissions,
      },
    };
    this.progressDataDialog = {
      item: {
        id: col.id,
        requiresExplicitEntry: col.requiresExplicitEntry,
        string: {
          title: col.title,
        },
      },
      group: rawGroupRoute({ id: row.id, isUser: this.currentFilter === 'Users' }),
      groupName: row.header,
      sourceGroupName: this.group.name,
    };
  }

  hideProgressDetail(): void {
    this.progressOverlay = undefined;
  }

  fetchRows(): void {
    this.datapager.reset();
    this.refresh$.next(); // refreshes the columns.
    this.fetchMoreRows();
  }

  private getProgress({ itemId, groupId, filter, pageSize, fromId }: DataFetching): Observable<Progress[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupUsersProgressService.getUsersProgress(groupId, [ itemId ], { limit: pageSize, fromId }).pipe(
          map(progress => progress.map(p => ({ ...p, type: 'user' }))),
        );
      case 'Teams':
        return this.getGroupUsersProgressService.getTeamsProgress(groupId, [ itemId ]).pipe(
          map(progress => progress.map(p => ({ ...p, type: 'user' }))),
        );
      case 'Groups':
        return this.getGroupUsersProgressService.getGroupsProgress(groupId, [ itemId ])
          .pipe(map(groupsProgress => groupsProgress.map(p => ({
            type: 'group',
            groupId: p.groupId,
            itemId: p.itemId,
            validationRate: p.validationRate,
            score: p.averageScore,
            timeSpent: p.avgTimeSpent,
            hintsRequested: p.avgHintsRequested,
            submissions: p.avgSubmissions,
            latestActivityAt: null,
          }))));
    }
  }

  private getRows({ groupId, filter, pageSize, fromId }: Omit<DataFetching, 'itemId'>): Observable<{id :string, value: string}[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupDescendantsService.getUserDescendants(groupId, { limit: pageSize, fromId })
          .pipe(map(users => users.map(user => ({ id: user.id, value: formatUser(user.user) }))));
      case 'Teams':
        return this.getGroupDescendantsService.getTeamDescendants(groupId)
          .pipe(map(teams => teams.map(team => ({ id: team.id, value: team.name }))));
      case 'Groups':
        return this.getGroupChildrenService.getGroupChildren(groupId, [], [], [ 'Team', 'User' ])
          .pipe(map(groups => groups.map(group => ({ id: group.id, value: group.name }))));
    }
  }

  private getRowsWithProgress({ itemId, groupId, filter, fromId, pageSize }: DataFetching): Observable<DataRow[]> {
    return forkJoin({
      rows: this.getRows({ groupId, filter, pageSize, fromId }),
      progress: this.getProgress({ itemId, groupId, filter, pageSize, fromId }),
    }).pipe(
      combineLatestWith(this.columns$.pipe(readyData())),
      map(([{ rows, progress }, items ]) =>
        rows
          .filter(row => progress.find(progress => progress.groupId === row.id)) // only keep rows with a defined progress
          .map(row => ({
            header: row.value,
            id: row.id,
            data: items.map(item =>
              progress.find(progress => progress.itemId === item.id && progress.groupId === row.id)
            ),
          })),
      )
    );
  }

  onFilterChange(typeFilter: TypeFilter): void {
    if (typeFilter !== this.currentFilter) {
      this.currentFilter = typeFilter;
      this.fetchRows();
    }
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }

  onAccessPermissions(): void {
    this.hideProgressDetail();
    if (!this.progressDataDialog) throw new Error('Unexpected: progress data dialog');
    if (!this.itemData) throw new Error('Unexpected: missed item data');
    if (!this.sourceGroup) throw new Error('Unexpected: missed source group');
    this.dialogService.open<boolean, PermissionsEditDialogParams>(PermissionsEditDialogComponent, {
      data: {
        currentUserPermissions: this.itemData.item.permissions,
        item: this.progressDataDialog.item,
        group: this.progressDataDialog.group,
        sourceGroup: this.sourceGroup,
        permReceiverName: this.progressDataDialog.groupName,
        permGiverName: this.progressDataDialog.sourceGroupName,
      },
      disableClose: true,
    }).closed.subscribe(() => {
      this.progressDataDialog = undefined;
    });
  }

  getCSVDownloadTypeByFilter(): 'group' | 'team' | 'user' {
    switch (this.currentFilter) {
      case 'Groups':
        return 'group';
      case 'Users':
        return 'user';
      case 'Teams':
        return 'team';
    }
  }

  onCSVExport(): void {
    if (!this.group || !this.itemData) {
      throw new Error('Unexpected: input component params is required');
    }

    const parentItemId = this.itemData.item.id;
    const downloadDataType = this.getCSVDownloadTypeByFilter();

    this.isCSVDataFetching = true;
    this.progressCSVService
      .getCSVData(this.group.id, downloadDataType, [ parentItemId ])
      .subscribe({
        next: data => {
          this.isCSVDataFetching = false;
          downloadFile([ data ], `${parentItemId}-${new Date().toDateString()}.csv`, 'text/csv');
        },
        error: err => {
          this.isCSVDataFetching = false;
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  private getColumns(itemData: ItemData): Observable<DataColumn[]> {
    if (!itemData.currentResult?.attemptId) throw new Error('unexpected');
    return this.getItemChildrenService.get(itemData.item.id, itemData.currentResult.attemptId).pipe(
      map(items => [
        {
          id: itemData.item.id,
          requiresExplicitEntry: itemData.item.requiresExplicitEntry,
          title: itemData.item.string.title,
          type: itemData.item.type,
          permissions: itemData.item.permissions,
        },
        ...items.map(item => ({
          id: item.id,
          requiresExplicitEntry: !!item.requiresExplicitEntry,
          title: item.string.title,
          type: item.type,
          permissions: item.permissions,
        }))
      ]),
    );
  }
}
