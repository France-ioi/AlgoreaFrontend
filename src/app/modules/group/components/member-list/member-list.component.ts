import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';
import { GroupUsersService, parseResults } from '../../http-services/group-users.service';
import { Filter, GroupCompositionFilterComponent, TypeFilter } from '../group-composition-filter/group-composition-filter.component';
import { displayResponseToast } from './user-removal-response-handling';
import { displayGroupResponseToast } from './group-removal-response-handling';
import { RemoveSubgroupService } from '../../http-services/remove-subgroup.service';
import { RemoveGroupService } from '../../http-services/remove-group.service';

function getSelectedGroupChildCaptions(selection: GroupChild[]): string {
  return selection.map(selected => selected.name).join(', ');
}

interface Column {
  sortable?: boolean,
  field: string,
  header: string
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
  { field: 'login', header: $localize`Name` },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
];

const descendantTeamsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
  { field: 'members', header: $localize`Member(s)` },
];

interface Data {
  columns: Column[],
  rowData: (Member|GroupChild|{ login: string, parentGroups: string }|{ name: string, parentGroups: string, members: string })[],
}

@Component({
  selector: 'alg-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: [ './member-list.component.scss' ]
})
export class MemberListComponent implements OnChanges, OnDestroy {

  @Input() group? : Group;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  defaultFilter: Filter = { type: TypeFilter.Users, directChildren: true };

  currentSort: string[] = [];
  currentFilter: Filter = this.defaultFilter;

  selection: (Member | GroupChild)[] = [];

  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;
  @ViewChild('compositionFilter') private compositionFilter?: GroupCompositionFilterComponent;

  private dataFetching = new Subject<{ groupId: string, filter: Filter, sort: string[] }>();
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
  ) {
    this.dataFetching.pipe(
      switchMap(params => this.getData(params.groupId, params.filter, params.sort).pipe(mapToFetchState())),
    ).subscribe({
      next: state => {
        this.state = state.tag;
        if (state.isReady) this.data = state.data;
        this.unselectAll();
      },
      error: _err => {
        this.state = 'error';
      }
    });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.group) return;
    this.currentFilter = { ...this.defaultFilter };
    this.currentSort = [];
    this.table?.clear();
    this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
  }

  fetchData(): void {
    if (!this.group) return;
    this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
  }

  getData(groupId: string, filter: Filter, sort: string[]): Observable<Data> {
    switch (filter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(groupId, sort, [], [ 'Team', 'Session', 'User' ])
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children
          })));
      case TypeFilter.Sessions:
        return this.getGroupChildrenService.getGroupChildren(groupId, sort, [ 'Session' ])
          .pipe(map(children => ({
            columns: nameUserCountColumns,
            rowData: children,
          })));
      case TypeFilter.Teams:
        if (!filter.directChildren) {
          return this.getGroupDescendantsService.getTeamDescendants(groupId, sort)
            .pipe(map(descendantTeams => ({
              columns: descendantTeamsColumns,
              rowData: descendantTeams.map(descendantTeam => ({
                name: descendantTeam.name,
                parentGroups: descendantTeam.parents.map(parent => parent.name).join(', '),
                members: descendantTeam.members.map(member => member.login).join(', '),
              })),
            })));
        } else {
          return this.getGroupChildrenService.getGroupChildren(groupId, sort, [ 'Team' ])
            .pipe(map(children => ({
              columns: nameUserCountColumns,
              rowData: children,
            })));
        }
      case TypeFilter.Users:
        if (filter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(groupId, sort)
            .pipe(map(members => ({ columns: usersColumns, rowData: members })));
        } else {
          return this.getGroupDescendantsService.getUserDescendants(groupId, sort)
            .pipe(map(descendantUsers => ({
              columns: descendantUsersColumns,
              rowData: descendantUsers.map(descendantUser => ({
                login: descendantUser.user.login,
                parentGroups: descendantUser.parents.map(parent => parent.name).join(', ')
              }))
            })));
        }
    }
  }

  onCustomSort(event: SortEvent): void {
    if (!this.group) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
    }
  }

  onFilterChange(filter: Filter): void {
    if (!this.group) return;

    if (filter !== this.currentFilter) {
      this.currentFilter = { ...filter };
      this.currentSort = [];
      this.table?.clear();
      this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
    }
  }

  setFilter(filter: Filter): void {
    this.compositionFilter?.setFilter(filter);
    this.onFilterChange(filter);
  }

  onSelectAll(): void {
    if (this.selection.length === this.data.rowData.length) {
      this.selection = [];
    } else {
      this.selection = this.data.rowData as (Member | GroupChild)[];
    }
  }

  unselectAll(): void {
    this.selection = [];
  }

  removeUsers(groupId: string, selectedIds: string[]): void {
    this.removalInProgress$.next(true);
    this.groupUsersService.removeUsers(groupId, selectedIds)
      .subscribe({
        next: result => {
          displayResponseToast(this.actionFeedbackService, parseResults(result));
          this.table?.clear();
          this.unselectAll();
          this.fetchData();
          this.removalInProgress$.next(false);
        },
        error: _err => {
          this.removalInProgress$.next(false);
          this.actionFeedbackService.unexpectedError();
        }
      });
  }

  onRemoveGroup(event: Event, selectedIds: string[]): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-exclamation-triangle',
      message: $localize`Are you sure you want to permanently delete ${getSelectedGroupChildCaptions(this.selection as GroupChild[])}?
       This operation cannot be undone.`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'fa fa-check',
      rejectLabel: $localize`No`,
      accept: () => this.removeGroupsOrSubgroups(selectedIds),
    });
  }

  onRemoveSubgroups(event: Event, groupId: string, selectedIds: string[]): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-exclamation-triangle',
      message: $localize`By removing ${getSelectedGroupChildCaptions(this.selection as GroupChild[])} from the group, you may loose
       manager access to them (if no explicit permission or through other parent group). Are you sure you want to proceed?`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'fa fa-check',
      rejectLabel: $localize`No`,
      accept: () => this.removeGroupsOrSubgroups(selectedIds, groupId),
    });
  }

  removeGroupsOrSubgroups(selectedIds: string[], groupId?: string): void {
    this.removalInProgress$.next(true);
    const request$ = groupId ?
      this.removeSubgroupService.removeBatch(groupId, selectedIds) : this.removeGroupService.removeBatch(selectedIds);

    request$.subscribe({
      next: response => {
        displayGroupResponseToast(this.actionFeedbackService, response);
        this.table?.clear();
        this.unselectAll();
        this.fetchData();
        this.removalInProgress$.next(false);
      },
      error: _err => {
        this.removalInProgress$.next(false);
        this.actionFeedbackService.unexpectedError();
      }
    });
  }

  onRemove(event: Event): void {
    if (this.selection.length === 0 || !this.group) return;

    const groupId = this.group.id;
    const selectedIds = this.selection.map(member => member.id);

    if (this.currentFilter.type === 'users') {
      this.removeUsers(groupId, selectedIds);
      return;
    }

    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-question-circle',
      message: $localize`Do you want to also delete the selected group(s)? (will only work if those are empty)`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'fa fa-check',
      rejectLabel: $localize`No`,
      accept: () => {
        // ISSUE: https://github.com/primefaces/primeng/issues/10589
        setTimeout(() => {
          this.onRemoveGroup(event, selectedIds);
        }, 250);
      },
      reject: () => {
        setTimeout(() => {
          this.onRemoveSubgroups(event, groupId, selectedIds);
        }, 250);
      }
    });
  }
}
