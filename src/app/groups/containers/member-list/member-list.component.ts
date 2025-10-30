import { Component, computed, EventEmitter, Input, OnChanges, OnDestroy, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { defer, Observable, of, ReplaySubject } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { groupRoute, rawGroupRoute, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GetGroupChildrenService, GroupChild } from '../../data-access/get-group-children.service';
import { GetGroupMembersService, GroupMembers } from '../../data-access/get-group-members.service';
import { GroupUsersService, parseResults } from '../../data-access/group-users.service';
import { GroupData } from '../../models/group-data';
import { Filter, GroupCompositionFilterComponent, TypeFilter } from '../group-composition-filter/group-composition-filter.component';
import { displayResponseToast } from './user-removal-response-handling';
import { displayGroupRemovalResponseToast } from './group-removal-response-handling';
import { RemoveSubgroupService } from '../../data-access/remove-subgroup.service';
import { RemoveGroupService } from '../../data-access/remove-group.service';
import { FetchState } from 'src/app/utils/state';
import { DataPager } from 'src/app/utils/data-pager';
import { HttpErrorResponse } from '@angular/common/http';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
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
  CdkTable
} from '@angular/cdk/table';
import { TableSortDirective } from 'src/app/ui-components/table-sort/table-sort.directive';
import { SortEvent, TableSortHeaderComponent } from 'src/app/ui-components/table-sort/table-sort-header/table-sort-header.component';
import { FindInArray } from 'src/app/pipes/findInArray';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';

type Member = GroupMembers[number];

function getSelectedGroupChildCaptions(selection: GroupChild[]): string {
  return selection.map(selected => selected.name).join(', ');
}

interface Column {
  sortable?: boolean,
  field: string,
  header: string,
}

const usersColumns: Column[] = [
  { field: 'user.login', header: $localize`Name`, sortable: true },
  { field: 'member_since', header: $localize`Member Since`, sortable: true },
];

const groupsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'type', header: $localize`Type` },
  { field: 'userCount', header: $localize`User Count` },
];

const nameUserCountColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'userCount', header: $localize`User Count` },
];

const descendantUsersColumns: Column[] = [
  { field: 'user.login', header: $localize`Name` },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
];

const descendantTeamsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
  { field: 'members', header: $localize`Member(s)` },
];

const membersLimit = 25;

type Row = (Member|GroupChild|{ login: string, parentGroups: string }|{ name: string, parentGroups: string, members: string }) &
 { route: RawGroupRoute };

@Component({
  selector: 'alg-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: [ './member-list.component.scss' ],
  standalone: true,
  imports: [
    GroupCompositionFilterComponent,
    NgIf,
    ErrorComponent,
    NgSwitch,
    NgSwitchCase,
    RouterLink,
    NgSwitchDefault,
    AsyncPipe,
    DatePipe,
    GroupLinkPipe,
    UserCaptionPipe,
    NgClass,
    ButtonComponent,
    CdkTable,
    TableSortDirective,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
    CdkCell,
    CdkCellDef,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    TableSortHeaderComponent,
    FindInArray,
    LoadingComponent,
  ],
})
export class MemberListComponent implements OnChanges, OnDestroy {

  @Input() groupData? : GroupData;
  @Output() removedGroup = new EventEmitter<void>();

  defaultFilter: Filter = { type: TypeFilter.Users, directChildren: true };

  currentSort: string[] = [];
  currentFilter: Filter = this.defaultFilter;

  selection: (Member | GroupChild)[] = [];

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: Row): Observable<Row[]> => this.getRows(pageSize, latestRow),
    pageSize: membersLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more members, are you connected to the internet?`);
    },
  });
  rows$: Observable<FetchState<Row[]>> = this.datapager.list$;

  @ViewChild('compositionFilter') private compositionFilter?: GroupCompositionFilterComponent;

  removalInProgress$ = new ReplaySubject<boolean>();

  currentUserCanManage = signal(false);
  columns = signal<Column[]>([]);
  displayedColumns = computed(() => [
    ...(this.currentUserCanManage() ? [ 'checkbox' ] : []),
    ...this.columns().map(column => column.field),
  ]);

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private groupUsersService: GroupUsersService,
    private actionFeedbackService: ActionFeedbackService,
    private removeSubgroupService: RemoveSubgroupService,
    private confirmationModalService: ConfirmationModalService,
    private removeGroupService: RemoveGroupService,
  ) { }

  ngOnDestroy(): void {
    this.removalInProgress$.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.groupData) return;

    this.currentFilter = { ...this.defaultFilter };
    this.currentUserCanManage.set(this.groupData.group.currentUserCanManage !== 'none');
    this.columns.set(this.getColumns(this.currentFilter));
    this.currentSort = [];
    this.fetchRows();
  }

  fetchRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }

  getRows(pageSize: number, latestRow?: Row): Observable<Row[]> {
    if (!this.groupData) throw new Error('group data must be defined to fetch data');
    const route = this.groupData.route;

    switch (this.currentFilter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(
          route.id,
          this.currentSort,
          [],
          [ 'Team', 'Session', 'User' ],
        ).pipe(map(children => children.map(child => ({
          ...child,
          route: groupRoute(child, [ ...route.path, route.id ]),
        }))));
      case TypeFilter.Sessions:
        return this.getGroupChildrenService.getGroupChildren(route.id, this.currentSort, [ 'Session' ])
          .pipe(map(children => children.map(child => ({
            ...child,
            route: groupRoute(child, [ ...route.path, route.id ]),
          }))));
      case TypeFilter.Teams:
        if (!this.currentFilter.directChildren) {
          return this.getGroupDescendantsService.getTeamDescendants(route.id, { sort: this.currentSort })
            .pipe(map(descendantTeams => descendantTeams.map(descendantTeam => ({
              id: descendantTeam.id,
              name: descendantTeam.name,
              parentGroups: descendantTeam.parents.map(parent => parent.name).join(', '),
              members: descendantTeam.members.map(member => member.login).join(', '),
              route: rawGroupRoute({ id: descendantTeam.id, isUser: false }),
            }))));
        } else {
          return this.getGroupChildrenService.getGroupChildren(route.id, this.currentSort, [ 'Team' ])
            .pipe(map(children => children.map(child => ({
              ...child,
              route: groupRoute(child, [ ...route.path, route.id ]),
            }))));
        }
      case TypeFilter.Users:
        if (this.currentFilter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(
            route.id,
            this.currentSort,
            membersLimit,
            (latestRow as Member|undefined)?.id,
          ).pipe(
            map(members => members.map(member => ({
              ...member,
              route: groupRoute({ id: member.id, isUser: true }, [ ...route.path, route.id ]),
            }))));
        } else {
          return this.getGroupDescendantsService.getUserDescendants(route.id, {
            sort: this.currentSort,
            limit: pageSize,
            fromId: (latestRow as Member|undefined)?.id,
          }).pipe(map(descendantUsers => descendantUsers.map(descendantUser => ({
            id: descendantUser.id,
            login: descendantUser.user.login,
            user: descendantUser.user,
            parentGroups: descendantUser.parents.map(parent => parent.name).join(', '),
            route: rawGroupRoute({ id: descendantUser.id, isUser: true }),
          }))));
        }
    }
  }

  onSortChange(events: SortEvent[]): void {
    if (!this.groupData) return;

    const sortMeta = events.filter(meta => meta.order !== 0).map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta.length > 0 && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.fetchRows();
    }
  }

  onFilterChange(filter: Filter): void {
    if (!this.groupData) return;

    if (filter !== this.currentFilter) {
      this.currentFilter = { ...filter };
      this.columns.set(this.getColumns(filter));
      this.currentSort = [];
      this.fetchRows();
    }
  }

  setFilter(filter: Filter): void {
    this.compositionFilter?.setFilter(filter);
    this.onFilterChange(filter);
  }

  onSelectAll(rows: Row[]): void {
    if (this.selection.length === rows.length) {
      this.selection = [];
    } else {
      this.selection = rows as (Member | GroupChild)[];
    }
  }

  unselectAll(): void {
    this.selection = [];
  }

  onSelect(item: (Member | GroupChild)): void {
    if (this.selection.includes(item)) {
      const idx = this.selection.indexOf(item);
      this.selection = [
        ...this.selection.slice(0, idx),
        ...this.selection.slice(idx + 1),
      ];
    } else {
      this.selection = [ ...this.selection, item ];
    }
  }

  removeUsers(groupId: string): void {
    if (this.selection.length === 0) {
      throw new Error('Unexpected: Missed selected members');
    }

    const selectedMemberIds = this.selection.map(member => member.id);

    this.removalInProgress$.next(true);
    this.groupUsersService.removeUsers(groupId, selectedMemberIds)
      .subscribe({
        next: result => {
          displayResponseToast(this.actionFeedbackService, parseResults(result));
          this.unselectAll();
          this.fetchRows();
          this.removalInProgress$.next(false);
        },
        error: err => {
          this.removalInProgress$.next(false);
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
  }

  removeGroupsOrSubgroups(selectedGroupChildren: GroupChild[], groupId: string): void {
    const selectedGroupChildIds = selectedGroupChildren.map(g => g.id);
    const isSubgroupsEmpty = selectedGroupChildren.every(g => g.isEmpty);

    this.removalInProgress$.next(true);

    const confirmRemoveGroup$ = defer(() => this.confirmationModalService.open({
      message: `Are you sure you want to permanently delete ${getSelectedGroupChildCaptions(selectedGroupChildren)}?
        This operation cannot be undone.`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }, { maxWidth: '37.5rem' }).pipe(filter(accepted => !!accepted)));

    const confirmRemoveSubgroups$ = defer(() => this.confirmationModalService.open({
      message: `By removing ${getSelectedGroupChildCaptions(selectedGroupChildren)} from the group, you may loose
        manager access to them (if no explicit permission or through other parent group). Are you sure you want to proceed?`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }, { maxWidth: '37.5rem' }).pipe(filter(accepted => !!accepted)));

    const proceedRemoving$: Observable<boolean | undefined> = isSubgroupsEmpty ? this.confirmationModalService.open({
      message: selectedGroupChildren.length === 1 ?
        $localize`Do you also want to delete the group?` :
        $localize`These groups are all empty. Do you also want to delete them?`,
      acceptIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
    }).pipe(filter(accepted => accepted !== undefined)) : of(undefined);

    proceedRemoving$.pipe(
      switchMap(allowToRemoveGroup => (
        allowToRemoveGroup === true
          ? confirmRemoveGroup$.pipe(switchMap(() => this.removeGroupService.removeBatch(selectedGroupChildIds)))
          : confirmRemoveSubgroups$.pipe(switchMap(() => this.removeSubgroupService.removeBatch(groupId, selectedGroupChildIds)))
      ))
    ).subscribe({
      next: response => {
        displayGroupRemovalResponseToast(this.actionFeedbackService, response);
        this.unselectAll();
        this.fetchRows();
        this.removalInProgress$.next(false);
        this.removedGroup.emit();
      },
      error: err => {
        this.removalInProgress$.next(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
      complete: () => this.removalInProgress$.next(false)
    });
  }

  onRemove(): void {
    if (this.selection.length === 0 || !this.groupData) throw new Error('Unexpected: Missed group data or selected models');
    const groupId = this.groupData.group.id;
    if (this.currentFilter.type === TypeFilter.Users) {
      this.removeUsers(groupId);
    } else {
      this.removeGroupsOrSubgroups(this.selection as GroupChild[], groupId);
    }
  }

  private getColumns(filter: Filter): Column[] {
    switch (filter.type) {
      case TypeFilter.Groups: return groupsColumns;
      case TypeFilter.Sessions: return nameUserCountColumns;
      case TypeFilter.Teams: return this.currentFilter.directChildren ? nameUserCountColumns : descendantTeamsColumns;
      case TypeFilter.Users: return this.currentFilter.directChildren ? usersColumns : descendantUsersColumns;
    }
  }
}
