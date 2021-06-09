import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { animationFrames, forkJoin, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { map, mapTo, scan, switchMap, take, takeUntil, takeWhile } from 'rxjs/operators';
import { canCurrentUserGrantGroupAccess } from 'src/app/modules/group/helpers/group-management';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { GetGroupChildrenService } from 'src/app/modules/group/http-services/get-group-children.service';
import { fetchingState, readyState } from 'src/app/shared/helpers/state';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { GetGroupProgressService, TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { GroupPermissionsService, Permissions } from 'src/app/shared/http-services/group-permissions.service';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { TypeFilter } from '../../components/composition-filter/composition-filter.component';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';

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

  @ViewChild('progressOverlayPanel') progressOverlayPanel?: OverlayPanel;

  defaultFilter: TypeFilter = 'Users';

  currentFilter = this.defaultFilter;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  data: Data = {
    type: this.defaultFilter,
    items: [],
    rows: [],
    can_access: false,
  };

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

  progressDetail?: {
    userProgress: TeamUserProgress,
    title: string,
    groupId: string,
    itemId: string,
    hasScore: boolean,
    isSuccess: boolean,
  };

  dialog: 'loading'|'opened'|'closed' = 'closed';
  dialogTitle = '';

  private dataFetching = new Subject<{ groupId: string, itemId: string, attemptId: string, filter: TypeFilter }>();
  private permissionsFetchingSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private getGroupUsersProgressService: GetGroupProgressService,
    private getGroupChildrenService: GetGroupChildrenService,
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getData(params.itemId, params.groupId, params.attemptId, params.filter).pipe(map(readyState))
        )
      )).subscribe(
      state => {
        this.state = state.tag;
        if (state.isReady) this.setDataByBatch(state.data);
      },
      _err => {
        this.state = 'error';
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dataFetching.complete();
    this.permissionsFetchingSubscription?.unsubscribe();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData || !this.itemData.currentResult || !this.group) {
      this.state = 'error';
      return;
    }
    this.dialog = 'closed';
    this.dataFetching.next({
      groupId: this.group.id,
      itemId: this.itemData.item.id,
      attemptId: this.itemData.currentResult.attemptId,
      filter: this.currentFilter
    });
  }

  trackByRow(_index: number, row: Data['rows'][number]): string {
    return row.id;
  }

  showProgressDetail(
    event: Event,
    target: HTMLElement,
    userProgress: TeamUserProgress,
    row: Data['rows'][number],
    col: Data['items'][number],
  ): void {
    const isSuccess = userProgress.validated || userProgress.score === 100;
    const isStarted = isSuccess || userProgress.score > 0 || userProgress.timeSpent > 0;

    const isCurrentDetail = this.progressDetail?.userProgress === userProgress;
    if (isCurrentDetail || !isStarted) return;
    if (!this.progressOverlayPanel) throw new Error('progressOverlayPanel should be defined');

    const isAlreadyOpened = !!this.progressDetail;
    const showPanel$ = isAlreadyOpened
      ? this.progressOverlayPanel.onHide.asObservable()
      : of(undefined);

    showPanel$.pipe(
      switchMap(() => animationFrames()),
      take(1),
      mapTo(this.progressOverlayPanel),
    ).subscribe(panel => {
      this.progressDetail = {
        userProgress,
        title: row.header,
        groupId: row.id,
        itemId: col.id,
        hasScore: isStarted && !isSuccess,
        isSuccess,
      };
      panel.show(event, target);
    });

    if (isAlreadyOpened) this.hideProgressDetail();
  }

  hideProgressDetail(): void {
    if (!this.progressDetail) return;
    this.progressDetail = undefined;
    this.progressOverlayPanel?.hide();
  }

  private setDataByBatch(data: Data, size = 25): void {
    const { rows } = data;
    const maxCount = Math.ceil(rows.length / size);

    this.data = { ...data, rows: [] };
    animationFrames().pipe(
      takeUntil(this.destroy$),
      scan(count => count + 1, 0),
      takeWhile(count => count <= maxCount),
      map(count => count * size),
    ).subscribe(lastIndex => {
      this.data.rows = rows.slice(0, lastIndex);
    });
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
    if (!this.itemData || !this.itemData.currentResult || !this.group) {
      this.state = 'error';
      return;
    }

    if (typeFilter !== this.currentFilter) {
      this.currentFilter = typeFilter;
      this.dataFetching.next({
        groupId: this.group.id,
        itemId: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
        filter: this.currentFilter
      });
    }
  }

  onAccessPermissions(title: string, targetGroupId: string, itemId: string): void {
    if (!this.group) return;

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
      .subscribe(
        _res => this.actionFeedbackService.success($localize`Permissions successfully updated.`),
        _err => this.actionFeedbackService.unexpectedError(),
      );
  }

}
