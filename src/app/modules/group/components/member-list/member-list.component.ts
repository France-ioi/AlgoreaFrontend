import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { GroupRoute, groupRoute, rawGroupRoute, RawGroupRoute } from 'src/app/shared/routing/group-route';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';
import { GroupUsersService, parseResults } from '../../http-services/group-users.service';
import { GroupData } from '../../services/group-datasource.service';
import { Filter, GroupCompositionFilterComponent, TypeFilter } from '../group-composition-filter/group-composition-filter.component';
import { displayResponseToast } from './user-removal-response-handling';
import { displayGroupRemovalResponseToast } from './group-removal-response-handling';
import { RemoveSubgroupService } from '../../http-services/remove-subgroup.service';
import { RemoveGroupService } from '../../http-services/remove-group.service';
import { FetchState } from 'src/app/shared/helpers/state';
import { canLoadMoreItems } from 'src/app/shared/helpers/load-more';

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

interface Data {
  columns: Column[],
  rowData: (
    (Member|GroupChild|{ login: string, parentGroups: string }|{ name: string, parentGroups: string, members: string }) &
    { route: RawGroupRoute }
  )[],
}

interface DataFetching {
  route: GroupRoute,
  filter: Filter,
  sort: string[],
  fromId?: string,
}

@Component({
  selector: 'alg-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: [ './member-list.component.scss' ]
})
export class MemberListComponent implements OnChanges, OnDestroy {

  @Input() groupData? : GroupData;

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

  private dataFetching = new Subject<DataFetching>();
  removalInProgress$ = new ReplaySubject<boolean>();
  loadMore: { fromId: string } | null = null;

  private refresh$ = new Subject<void>();

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
      switchMap(params => this.getData(params).pipe(mapToFetchState({ resetter: this.refresh$ }))),
      withLatestFrom(this.dataFetching),
    ).subscribe({
      next: ([ state, dataFetching ]) => {
        if (state.isError && dataFetching.fromId) {
          this.actionFeedbackService.error($localize`Could not load more members, are you connected to the internet?`);
          this.state = 'ready';
          return;
        }
        this.state = state.tag;

        if (state.isReady) {
          const isLoadMore = !!dataFetching.fromId;
          this.data = isLoadMore
            ? { ...this.data, rowData: [ ...this.data.rowData, ...state.data.rowData ] }
            : state.data;
        }
        this.loadMore = this.getLoadMore(state, dataFetching);
        this.unselectAll();
      },
      error: _err => {
        this.state = 'error';
      }
    });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
    this.refresh$.complete();
    this.removalInProgress$.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.groupData) return;

    this.currentFilter = { ...this.defaultFilter };
    this.currentSort = [];
    this.table?.clear();
    this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort });
  }

  fetchData(fromId?: string): void {
    if (!this.groupData) return;
    this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort, fromId });
  }

  getData({ route, filter, sort, fromId }: DataFetching): Observable<Data> {
    switch (filter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(route.id, sort, [], [ 'Team', 'Session', 'User' ])
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children.map(child => ({
              ...child,
              route: groupRoute(child, [ ...route.path, route.id ]),
            })),
          })));
      case TypeFilter.Sessions:
        return this.getGroupChildrenService.getGroupChildren(route.id, sort, [ 'Session' ])
          .pipe(map(children => ({
            columns: nameUserCountColumns,
            rowData: children.map(child => ({
              ...child,
              route: groupRoute(child, [ ...route.path, route.id ]),
            })),
          })));
      case TypeFilter.Teams:
        if (!filter.directChildren) {
          return this.getGroupDescendantsService.getTeamDescendants(route.id, sort)
            .pipe(map(descendantTeams => ({
              columns: descendantTeamsColumns,
              rowData: descendantTeams.map(descendantTeam => ({
                id: descendantTeam.id,
                name: descendantTeam.name,
                parentGroups: descendantTeam.parents.map(parent => parent.name).join(', '),
                members: descendantTeam.members.map(member => member.login).join(', '),
                route: rawGroupRoute({ id: descendantTeam.id, isUser: false }),
              })),
            })));
        } else {
          return this.getGroupChildrenService.getGroupChildren(route.id, sort, [ 'Team' ])
            .pipe(map(children => ({
              columns: nameUserCountColumns,
              rowData: children.map(child => ({
                ...child,
                route: groupRoute(child, [ ...route.path, route.id ]),
              })),
            })));
        }
      case TypeFilter.Users:
        if (filter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(route.id, sort, membersLimit, fromId)
            .pipe(
              map(members => ({
                columns: usersColumns,
                rowData: members.map(member => ({
                  ...member,
                  route: groupRoute({ id: member.id, isUser: true }, [ ...route.path, route.id ]),
                })),
              }))
            );
        } else {
          return this.getGroupDescendantsService.getUserDescendants(route.id, sort)
            .pipe(map(descendantUsers => ({
              columns: descendantUsersColumns,
              rowData: descendantUsers.map(descendantUser => ({
                login: descendantUser.user.login,
                user: descendantUser.user,
                parentGroups: descendantUser.parents.map(parent => parent.name).join(', '),
                route: rawGroupRoute({ id: descendantUser.id, isUser: true }),
              }))
            })));
        }
    }
  }

  onCustomSort(event: SortEvent): void {
    if (!this.groupData) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort });
    }
  }

  onFilterChange(filter: Filter): void {
    if (!this.groupData) return;

    if (filter !== this.currentFilter) {
      this.currentFilter = { ...filter };
      this.currentSort = [];
      this.table?.clear();
      this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort });
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
          this.fetchData();
          this.removalInProgress$.next(false);
        },
        error: _err => {
          this.removalInProgress$.next(false);
          this.actionFeedbackService.unexpectedError();
        }
      });
  }

  onRemoveGroup(event: Event): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-exclamation-triangle',
      message: $localize`Are you sure you want to permanently delete ${getSelectedGroupChildCaptions(this.selection as GroupChild[])}?
       This operation cannot be undone.`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'fa fa-check',
      rejectLabel: $localize`No`,
      accept: () => this.removeGroupsOrSubgroups(),
    });
  }

  onRemoveSubgroups(event: Event, groupId: string): void {
    this.confirmationService.confirm({
      target: event.target || undefined,
      key: 'commonPopup',
      icon: 'pi pi-exclamation-triangle',
      message: $localize`By removing ${getSelectedGroupChildCaptions(this.selection as GroupChild[])} from the group, you may loose
       manager access to them (if no explicit permission or through other parent group). Are you sure you want to proceed?`,
      acceptLabel: $localize`Yes`,
      acceptIcon: 'fa fa-check',
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
    if (this.selection.length === 0 || !this.groupData) {
      throw new Error('Unexpected: Missed group data or selected models');
    }

    const groupId = this.groupData.group.id;

    if (this.currentFilter.type === 'users') {
      this.removeUsers(groupId);
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

  private getLoadMore(state: FetchState<Data>, dataFetching: DataFetching): { fromId: string } | null {
    const { filter } = dataFetching;
    const isListWithLoadMore = filter.type === TypeFilter.Users && filter.directChildren;
    if (!isListWithLoadMore) return null;

    if (state.isError) return null;
    if (!state.data) return this.loadMore;

    const rows = state.data.rowData as Member[];
    const last = rows[rows.length - 1];
    return last && canLoadMoreItems(rows, membersLimit)
      ? { fromId: last.id }
      : null;
  }
}
