import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, map, pairwise, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { canCurrentUserGrantGroupAccess } from 'src/app/modules/group/helpers/group-management';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { GetGroupChildrenService } from 'src/app/modules/group/http-services/get-group-children.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { GetGroupProgressService, TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { GroupPermissionsService } from 'src/app/shared/http-services/group-permissions.service';
import { Permissions } from 'src/app/shared/helpers/group-permissions';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
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
import { canLoadMoreItems } from 'src/app/shared/helpers/load-more';
import { fetchingState, readyState } from 'src/app/shared/helpers/state';

const progressListLimit = 25;

interface Data {
  type: TypeFilter,
  items: {
    id: string,
    title: string|null,
  }[],
  rows: {
    header: string,
    id: string,
    data: (TeamUserProgress|undefined)[],
  }[],
  can_access: boolean,
}
interface DataFetching {
  groupId: string,
  itemId: string,
  attemptId: string,
  filter: TypeFilter,
  title: string | null,
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

  private dataFetching$ = new ReplaySubject<DataFetching>(1);
  private permissionsFetchingSubscription?: Subscription;

  private lastFetchedData$ = this.dataFetching$.pipe(
    switchMap(dataFetching => this.getData(dataFetching).pipe(
      mapToFetchState(),
      map(state => ({ state, dataFetching })),
    )),
    shareReplay(1),
  );
  private thunkedData$ = this.lastFetchedData$.pipe(
    map(({ state }) => state),
    readyData(),
    startWith(undefined),
    pairwise(),
  ) as Observable<[Data | undefined, Data]>;

  state$ = this.lastFetchedData$.pipe(
    withLatestFrom(this.thunkedData$),
    map(([{ state, dataFetching }, [ previousData, currentData ] ]) => {
      const { fromId } = dataFetching;
      if (!fromId) return state; // Not load more => normal treatment

      if (state.isFetching) return fetchingState(currentData);
      if (state.isError) return readyState(currentData);

      if (!previousData) throw new Error('impossible: must have previous data when loading more items');
      if (previousData.rows.length === 0) return state;
      // When loaded more rows, prepend old rows to new state
      return readyState({
        ...state.data,
        rows: [ ...previousData.rows, ...state.data.rows ],
      });
    }),
  );
  loadMore$: Observable<{ fromId: string } | null> = this.lastFetchedData$.pipe(
    map(({ state }) => state),
    readyData(),
    map(fetchedData => {
      const last = fetchedData.rows[fetchedData.rows.length-1];
      if (!last || !canLoadMoreItems(fetchedData.rows, progressListLimit)) return null;
      return { fromId: last.id };
    }),
  );

  private loadMoreErrorSubscription = this.lastFetchedData$.pipe(
    filter(({ state, dataFetching: { fromId } }) => state.isError && !!fromId),
  ).subscribe(() => {
    this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
  });

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
  ) {
    this.dataFetching$.subscribe(dataFetching => {
      console.info({ dataFetching });
    });
  }

  ngOnDestroy(): void {
    this.dataFetching$.complete();
    this.permissionsFetchingSubscription?.unsubscribe();
    this.loadMoreErrorSubscription.unsubscribe();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.dialog = 'closed';
    this.fetchData();
  }

  trackByRow(_index: number, row: Data['rows'][number]): string {
    return row.id;
  }

  showProgressDetail(target: HTMLElement, userProgress: TeamUserProgress, row: Data['rows'][number], col: Data['items'][number]): void {
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

  refresh(): void {
    this.fetchData();
  }

  private getProgress(itemId: string, groupId: string, filter: TypeFilter, fromId?: string): Observable<TeamUserProgress[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupUsersProgressService.getUsersProgress(groupId, [ itemId ], progressListLimit, fromId);
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

  private getRows(groupId: string, filter: TypeFilter): Observable<{id :string, value: string}[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupDescendantsService.getUserDescendants(groupId)
          .pipe(map(users => users.map(user => ({ id: user.id, value: formatUser(user.user) }))));
      case 'Teams':
        return this.getGroupDescendantsService.getTeamDescendants(groupId)
          .pipe(map(teams => teams.map(team => ({ id: team.id, value: team.name }))));
      case 'Groups':
        return this.getGroupChildrenService.getGroupChildren(groupId, [], [], [ 'Team', 'User' ])
          .pipe(map(groups => groups.map(group => ({ id: group.id, value: group.name }))));
    }
  }

  private getData({ itemId, groupId, attemptId, filter, title, fromId }: DataFetching): Observable<Data> {
    return forkJoin({
      items: this.getItemChildrenService.get(itemId, attemptId),
      rows: this.getRows(groupId, filter),
      progress: this.getProgress(itemId, groupId, filter, fromId),
    }).pipe(
      map(data => ({
        type: filter,
        items: [
          {
            id: itemId,
            title: title,
          },
          ...data.items.map(item => ({
            id: item.id,
            title: item.string.title,
          }))
        ],
        rows: data.rows
          .filter(row => data.progress.find(progress => progress.groupId === row.id)) // only keep rows with a defined progress
          .map(row => ({
            header: row.value,
            id: row.id,
            data: [
              data.progress.find(progress => progress.itemId === itemId && progress.groupId === row.id),
              ...data.items.map(item =>
                data.progress.find(progress => progress.itemId === item.id && progress.groupId === row.id)
              )
            ],
          })),
        can_access: (this.group && canCurrentUserGrantGroupAccess(this.group)
          && this.itemData?.item.permissions.canGrantView !== 'none') || false,
      }))
    );
  }

  onFilterChange(typeFilter: TypeFilter): void {
    if (typeFilter !== this.currentFilter) {
      this.currentFilter = typeFilter;
      this.fetchData();
    }
  }

  fetchData(fromId?: string): void {
    if (!this.group || !this.itemData || !this.itemData.currentResult) throw new Error('properties are missing');
    this.dataFetching$.next({
      groupId: this.group.id,
      itemId: this.itemData.item.id,
      attemptId: this.itemData.currentResult.attemptId,
      filter: this.currentFilter,
      title: this.itemData.item.string.title,
      fromId,
    });
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
          this.actionFeedbackService.error($localize`The permissions cannot be retrieved. If the problem persists, please contact us.`),
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
}
