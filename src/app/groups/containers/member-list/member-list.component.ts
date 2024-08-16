import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ConfirmationService, SortEvent, SharedModule } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { groupRoute, rawGroupRoute, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GetGroupChildrenService, GroupChild } from '../../data-access/get-group-children.service';
import { GetGroupMembersService, GroupMembers } from '../../data-access/get-group-members.service';
import { GroupUsersService, parseResults } from '../../data-access/group-users.service';
import { GroupData } from '../../services/group-datasource.service';
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
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe, DatePipe, NgClass } from '@angular/common';

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
    TableModule,
    SharedModule,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    RouterLink,
    NgSwitchDefault,
    ButtonModule,
    AsyncPipe,
    DatePipe,
    GroupLinkPipe,
    UserCaptionPipe,
    NgClass,
  ],
})
export class MemberListComponent implements OnChanges, OnDestroy {

  @Input() groupData? : GroupData;
  @Output() removedGroup = new EventEmitter<void>();

  defaultFilter: Filter = { type: TypeFilter.Users, directChildren: true };

  currentSort: string[] = [];
  currentFilter: Filter = this.defaultFilter;

  selection: (Member | GroupChild)[] = [];

  columns: Column[] = [];
  datapager = new DataPager({
    fetch: (pageSize, latestRow?: Row): Observable<Row[]> => this.getRows(pageSize, latestRow),
    pageSize: membersLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more members, are you connected to the internet?`);
    },
  });
  rows$: Observable<FetchState<Row[]>> = this.datapager.list$;

  @ViewChild('table') private table?: Table;
  @ViewChild('compositionFilter') private compositionFilter?: GroupCompositionFilterComponent;

  removalInProgress$ = new ReplaySubject<boolean>();

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private groupUsersService: GroupUsersService,
    private actionFeedbackService: ActionFeedbackService,
    private removeSubgroupService: RemoveSubgroupService,
    private confirmationService: ConfirmationService,
    private removeGroupService: RemoveGroupService,
  ) { }

  ngOnDestroy(): void {
    this.removalInProgress$.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.groupData) return;

    this.currentFilter = { ...this.defaultFilter };
    this.columns = this.getColumns(this.currentFilter);
    this.currentSort = [];
    this.table?.clear();
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

  onCustomSort(event: SortEvent): void {
    if (!this.groupData) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.fetchRows();
    }
  }

  onFilterChange(filter: Filter): void {
    if (!this.groupData) return;

    if (filter !== this.currentFilter) {
      this.currentFilter = { ...filter };
      this.columns = this.getColumns(filter);
      this.table?.clear();
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
          this.table?.clear();
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

  onRemoveGroup(event: Event): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'ph-duotone ph-warning-circle',
      message: $localize`Are you sure you want to permanently delete ${getSelectedGroupChildCaptions(this.selection as GroupChild[])}?
       This operation cannot be undone.`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'ph-bold ph-check',
      rejectLabel: $localize`No`,
      accept: () => this.removeGroupsOrSubgroups(),
    });
  }

  onRemoveSubgroups(event: Event, groupId: string): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'ph-duotone ph-warning-circle',
      message: $localize`By removing ${getSelectedGroupChildCaptions(this.selection as GroupChild[])} from the group, you may loose
       manager access to them (if no explicit permission or through other parent group). Are you sure you want to proceed?`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'ph-bold ph-check',
      rejectLabel: $localize`No`,
      accept: () => this.removeGroupsOrSubgroups(groupId),
    });
  }

  removeGroupsOrSubgroups(groupId?: string): void {
    if (this.selection.length === 0) {
      throw new Error('Unexpected: Missed selected groups');
    }

    const selectedGroupIds = this.selection.map(group => group.id);

    this.removalInProgress$.next(true);
    const request$ = groupId ?
      this.removeSubgroupService.removeBatch(groupId, selectedGroupIds) : this.removeGroupService.removeBatch(selectedGroupIds);

    request$.subscribe({
      next: response => {
        displayGroupRemovalResponseToast(this.actionFeedbackService, response);
        this.table?.clear();
        this.unselectAll();
        this.fetchRows();
        this.removalInProgress$.next(false);
        this.removedGroup.emit();
      },
      error: err => {
        this.removalInProgress$.next(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  onRemove(event: Event): void {
    if (this.selection.length === 0 || !this.groupData) {
      throw new Error('Unexpected: Missed group data or selected models');
    }

    const groupId = this.groupData.group.id;
    if (this.currentFilter.type === TypeFilter.Users) {
      this.removeUsers(groupId);
      return;
    }

    const isSubgroupsEmpty = !(this.selection as GroupChild[]).some(g => !g.isEmpty);
    if (!isSubgroupsEmpty) {
      this.onRemoveSubgroups(event, groupId);
      return;
    }

    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-question-circle',
      message: this.selection.length === 1 ?
        $localize`Do you also want to delete the group?` :
        $localize`These groups are all empty. Do you also want to delete them?`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'ph-bold ph-check',
      rejectLabel: $localize`No`,
      accept: () => {
        // ISSUE: https://github.com/primefaces/primeng/issues/10589
        setTimeout(() => {
          this.onRemoveGroup(event);
        }, 250);
      },
      reject: () => {
        setTimeout(() => {
          this.onRemoveSubgroups(event, groupId);
        }, 250);
      }
    });
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
