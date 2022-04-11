import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { combineLatestWith, map, shareReplay, switchMap } from 'rxjs/operators';
import { canCurrentUserGrantGroupAccess } from 'src/app/modules/group/helpers/group-management';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { GetGroupChildrenService } from 'src/app/modules/group/http-services/get-group-children.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { GetGroupProgressService, TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { GroupPermissionsService } from 'src/app/shared/http-services/group-permissions.service';
import { Permissions } from 'src/app/shared/helpers/group-permissions';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { TypeFilter } from '../../components/composition-filter/composition-filter.component';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { ProgressCSVService } from '../../../../shared/http-services/progress-csv.service';
import { downloadFile } from '../../../../shared/helpers/download-file';
import { typeCategoryOfItem } from '../../../../shared/helpers/item-type';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { GroupRouter } from '../../../../shared/routing/group-router';
import { rawGroupRoute } from '../../../../shared/routing/group-route';
import { ProgressData } from '../../components/user-progress-details/user-progress-details.component';
import { DataPager } from 'src/app/shared/helpers/data-pager';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { FetchState } from 'src/app/shared/helpers/state';

const progressListLimit = 25;

interface DataRow {
  header: string,
  id: string,
  data: (TeamUserProgress|undefined)[],
}
interface DataColumn {
  id: string,
  title: string|null,
}
interface DataFetching {
  groupId: string,
  itemId: string,
  filter: TypeFilter,
  fromId?: string,
}

@Component({
  selector: 'alg-group-progress-grid',
  templateUrl: './group-progress-grid.component.html',
  styleUrls: [ './group-progress-grid.component.scss' ]
})
export class GroupProgressGridComponent implements OnChanges, OnDestroy {

  @Input() group?: Group;
  @Input() itemData?: ItemData;

  defaultFilter: TypeFilter = 'Users';

  currentFilter = this.defaultFilter;

  dialogPermissions: {
    permissions: Permissions,
    itemId: string,
    targetGroupId: string,
  } = {
      itemId: '',
      targetGroupId: '',
      permissions: {
        canView: 'none',
        canGrantView: 'none',
        canWatch: 'none',
        canEdit: 'none',
        canMakeSessionOfficial: false,
        isOwner: true,
      }
    };

  progressOverlay?: ProgressData;

  dialog: 'loading'|'opened'|'closed' = 'closed';
  dialogTitle = '';

  isCSVDataFetching = false;
  canAccess = false;

  private itemData$ = new ReplaySubject<ItemData>(1);
  private refresh$ = new Subject<void>();
  readonly columns$: Observable<FetchState<DataColumn[]>> = this.itemData$.pipe(
    switchMap(itemData => this.getColumns(itemData)),
    mapToFetchState({ resetter: this.refresh$ }),
    shareReplay(1),
  );

  private permissionsFetchingSubscription?: Subscription;

  readonly datapager = new DataPager<DataRow>({
    pageSize: progressListLimit,
    fetch: (latestRow?: DataRow): Observable<DataRow[]> => {
      if (!this.group || !this.itemData) throw new Error('properties are missing');
      return this.getRowsWithProgress({
        groupId: this.group.id,
        itemId: this.itemData.item.id,
        filter: this.currentFilter,
        fromId: latestRow?.id,
      });
    },
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
  });

  rows$ = this.datapager.state$;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private getGroupUsersProgressService: GetGroupProgressService,
    private getGroupChildrenService: GetGroupChildrenService,
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
    private progressCSVService: ProgressCSVService,
    private itemRouter: ItemRouter,
    private groupRouter: GroupRouter,
  ) {}

  ngOnDestroy(): void {
    this.permissionsFetchingSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.dialog = 'closed';
    if (changes.itemData && this.itemData) this.itemData$.next(this.itemData);
    if (changes.group) this.fetchRows();
    this.canAccess = !!(this.group && canCurrentUserGrantGroupAccess(this.group)
      && this.itemData?.item.permissions.canGrantView !== 'none');
  }

  trackByRow(_index: number, row: DataRow): string {
    return row.id;
  }

  showProgressDetail(target: HTMLElement, userProgress: TeamUserProgress, row: DataRow, col: DataColumn): void {
    if (this.progressOverlay?.target === target) return;
    this.progressOverlay = {
      accessPermissions: {
        title: row.header,
        groupId: row.id,
        itemId: col.id,
      },
      target,
      progress: userProgress,
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

  private getProgress(itemId: string, groupId: string, filter: TypeFilter, fromId?: string): Observable<TeamUserProgress[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupUsersProgressService.getUsersProgress(groupId, [ itemId ], {
          limit: progressListLimit,
          fromId,
        });
      case 'Teams':
        return this.getGroupUsersProgressService.getTeamsProgress(groupId, [ itemId ]);
      case 'Groups':
        return this.getGroupUsersProgressService.getGroupsProgress(groupId, [ itemId ])
          .pipe(map(groupsProgress => groupsProgress.map(m => ({
            groupId: m.groupId,
            itemId: m.itemId,
            validated: m.validationRate === 1,
            score: m.averageScore,
            timeSpent: m.avgTimeSpent,
            hintsRequested: m.avgHintsRequested,
            submissions: m.avgSubmissions,
            latestActivityAt: null,
          }))));
    }
  }

  private getRows(groupId: string, filter: TypeFilter, fromId?: string): Observable<{id :string, value: string}[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupDescendantsService.getUserDescendants(groupId, [], progressListLimit, fromId)
          .pipe(map(users => users.map(user => ({ id: user.id, value: formatUser(user.user) }))));
      case 'Teams':
        return this.getGroupDescendantsService.getTeamDescendants(groupId)
          .pipe(map(teams => teams.map(team => ({ id: team.id, value: team.name }))));
      case 'Groups':
        return this.getGroupChildrenService.getGroupChildren(groupId, [], [], [ 'Team', 'User' ])
          .pipe(map(groups => groups.map(group => ({ id: group.id, value: group.name }))));
    }
  }

  private getRowsWithProgress({ itemId, groupId, filter, fromId }: DataFetching): Observable<DataRow[]> {
    return forkJoin({
      rows: this.getRows(groupId, filter, fromId),
      progress: this.getProgress(itemId, groupId, filter, fromId),
    }).pipe(
      combineLatestWith(this.columns$.pipe(readyData())),
      map(([{ rows, progress }, items ]) =>
        rows
          .filter(row => progress.find(progress => progress.groupId === row.id)) // only keep rows with a defined progress
          .map(row => ({
            header: row.value,
            id: row.id,
            data: [
              progress.find(progress => progress.itemId === itemId && progress.groupId === row.id),
              ...items.map(item =>
                progress.find(progress => progress.itemId === item.id && progress.groupId === row.id)
              ),
            ],
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
    if (!this.group || !this.progressOverlay) return;
    const { title, groupId: targetGroupId, itemId } = this.progressOverlay.accessPermissions;

    this.hideProgressDetail();
    this.dialogTitle = title;
    this.dialog = 'loading';

    this.permissionsFetchingSubscription?.unsubscribe();
    this.permissionsFetchingSubscription = this.groupPermissionsService.getPermissions(this.group.id, targetGroupId, itemId)
      .subscribe({
        next: permissions => {
          this.dialogPermissions = {
            itemId: itemId,
            targetGroupId: targetGroupId,
            permissions: permissions.granted,
          };
          this.dialog = 'opened';
        },
        error: () =>
          this.actionFeedbackService.error($localize`The permissions cannot be retrieved. ` +
            $localize`:@@contactUs:If the problem persists, please contact us.`),
      });
  }

  onDialogClose(): void {
    this.dialog = 'closed';
  }

  onDialogSave(permissions: Permissions): void {
    if (!this.group) return;

    this.groupPermissionsService.updatePermissions(this.group.id, this.dialogPermissions.targetGroupId,
      this.dialogPermissions.itemId, permissions)
      .subscribe({
        next: _res => this.actionFeedbackService.success($localize`Permissions successfully updated.`),
        error: _err => this.actionFeedbackService.unexpectedError(),
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
        error: () => {
          this.isCSVDataFetching = false;
          this.actionFeedbackService.unexpectedError();
        },
      });
  }

  navigateToItem(item: { id: string, title: string | null }): void {
    if (!this.itemData) {
      throw new Error('Unexpected: Missed input itemData of component');
    }

    const parentAttemptId = this.itemData.currentResult?.attemptId;

    if (!parentAttemptId) throw new Error('Unexpected: Children have been loaded, so we are sure this item has an attempt');

    this.itemRouter.navigateTo({
      contentType: typeCategoryOfItem(this.itemData.item),
      id: item.id,
      path: this.itemData.route.path.concat([ this.itemData.item.id ]),
      parentAttemptId,
    });
  }

  navigateToGroup(row: { header: string, id: string, data: (TeamUserProgress|undefined)[] }): void {
    this.groupRouter.navigateTo(rawGroupRoute({ id: row.id, isUser: this.currentFilter === 'Users' }));
  }

  private getColumns(itemData: ItemData): Observable<DataColumn[]> {
    if (!itemData.currentResult?.attemptId) throw new Error('unexpected');
    return this.getItemChildrenService.get(itemData.item.id, itemData.currentResult.attemptId).pipe(
      map(items => [
        {
          id: itemData.item.id,
          title: itemData.item.string.title,
        },
        ...items.map(item => ({
          id: item.id,
          title: item.string.title,
        }))
      ]),
    );
  }
}
