import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { forkJoin, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { canCurrentUserGrantGroupAccess } from 'src/app/modules/group/helpers/group-management';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { GetGroupChildrenService } from 'src/app/modules/group/http-services/get-group-children.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { GetGroupProgressService, TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { GroupPermissionsService, Permissions } from 'src/app/shared/http-services/group-permissions.service';
import { progressiveObservableFromList } from 'src/app/shared/operators/progressive-observable-from-list';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { withPreviousFetchState } from 'src/app/shared/operators/with-previous-fetch-state';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { TypeFilter } from '../../components/composition-filter/composition-filter.component';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { ProgressCSVService } from '../../../../shared/http-services/progress-csv.service';
import { downloadFile } from '../../../../shared/helpers/download-file';

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
    permissions: Permissions
    itemId: string,
    targetGroupId: string,
  } = {
    itemId: '',
    targetGroupId: '',
    permissions: {
      can_view: 'none',
      can_grant_view: 'none',
      can_watch: 'none',
      can_edit: 'none',
      can_make_session_official: false,
      is_owner: true,
    }
  };

  progressOverlay?: {
    progress: TeamUserProgress,
    target: Element,
    accessPermissions: {
      title: string,
      groupId: string,
      itemId: string,
    };
  };

  dialog: 'loading'|'opened'|'closed' = 'closed';
  dialogTitle = '';

  isCSVDataFetching = false;

  private dataFetching$ = new ReplaySubject<{ groupId: string, itemId: string, attemptId: string, filter: TypeFilter }>(1);
  private permissionsFetchingSubscription?: Subscription;
  private refresh$ = new Subject<void>();

  state$ = this.dataFetching$.pipe(
    switchMap(params => this.getData(params.itemId, params.groupId, params.attemptId, params.filter).pipe(
      mapToFetchState({ resetter: this.refresh$ })
    )),
    withPreviousFetchState(),
    switchMap(([ previousState, state ]) => {
      if (!state.data) return of(state);
      return progressiveObservableFromList(state.data.rows, { initialIncrementSize: previousState.data?.rows.length }).pipe(
        map(rows => ({ ...state, data: { ...state.data, rows } })),
      );
    }),
  );

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private getGroupUsersProgressService: GetGroupProgressService,
    private getGroupChildrenService: GetGroupChildrenService,
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
    private progressCSVService: ProgressCSVService,
  ) {}

  ngOnDestroy(): void {
    this.dataFetching$.complete();
    this.permissionsFetchingSubscription?.unsubscribe();
    this.refresh$.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData || !this.itemData.currentResult || !this.group) throw new Error('properties are missing');

    this.dialog = 'closed';
    this.dataFetching$.next({
      groupId: this.group.id,
      itemId: this.itemData.item.id,
      attemptId: this.itemData.currentResult.attemptId,
      filter: this.currentFilter
    });
  }

  trackByRow(_index: number, row: Data['rows'][number]): string {
    return row.id;
  }

  showProgressDetail(target: HTMLElement, userProgress: TeamUserProgress, row: Data['rows'][number], col: Data['items'][number]): void {
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
    this.refresh$.next();
  }


  private getProgress(itemId: string, groupId: string, filter: TypeFilter): Observable<TeamUserProgress[]> {
    switch (filter) {
      case 'Users':
        return this.getGroupUsersProgressService.getUsersProgress(groupId, [ itemId ]);
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

  private getData(itemId: string, groupId: string, attemptId: string, filter: TypeFilter): Observable<Data> {
    return forkJoin({
      items: this.getItemChildrenService.get(itemId, attemptId),
      rows: this.getRows(groupId, filter),
      progress: this.getProgress(itemId, groupId, filter),
    }).pipe(
      map(data => ({
        type: filter,
        items: data.items.map(item => ({
          id: item.id,
          title: item.string.title,
        })),
        rows: data.rows.map(row => ({
          header: row.value,
          id: row.id,
          data: data.items.map(item =>
            data.progress.find(progress => progress.itemId === item.id && progress.groupId === row.id)
          ),
        })),
        can_access: (this.group && canCurrentUserGrantGroupAccess(this.group)
          && this.itemData?.item.permissions.canGrantView !== 'none') || false,
      }))
    );
  }

  onFilterChange(typeFilter: TypeFilter): void {
    if (!this.itemData || !this.itemData.currentResult || !this.group) throw new Error('properties are missing');

    if (typeFilter !== this.currentFilter) {
      this.currentFilter = typeFilter;
      this.dataFetching$.next({
        groupId: this.group.id,
        itemId: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
        filter: this.currentFilter
      });
    }
  }

  onAccessPermissions(): void {
    if (!this.group || !this.progressOverlay) return;
    const { title, groupId: targetGroupId, itemId } = this.progressOverlay.accessPermissions;

    this.hideProgressDetail();
    this.dialogTitle = title;
    this.dialog = 'loading';

    this.permissionsFetchingSubscription?.unsubscribe();
    this.permissionsFetchingSubscription = this.groupPermissionsService.getPermissions(this.group.id, targetGroupId, itemId)
      .subscribe(permissions => {
        this.dialogPermissions = {
          itemId: itemId,
          targetGroupId: targetGroupId,
          permissions: {
            can_view: permissions.granted.can_view,
            can_grant_view: permissions.granted.can_grant_view,
            can_watch: permissions.granted.can_watch,
            can_edit: permissions.granted.can_edit,
            is_owner: permissions.granted.is_owner,
            can_make_session_official: permissions.granted.can_make_session_official,
          }
        };
        this.dialog = 'opened';
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
          downloadFile([ data ], `${parentItemId}-${new Date().toDateString()}`, 'text/csv');
        },
        error: () => {
          this.isCSVDataFetching = false;
          this.actionFeedbackService.unexpectedError();
        },
      });
  }
}
