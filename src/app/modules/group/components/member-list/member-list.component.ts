import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/shared/http-services/get-group-descendants.service';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';
import { Filter, GroupCompositionFilterComponent } from '../group-composition-filter/group-composition-filter.component';

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

  defaultFilter: Filter = { type: 'users', directChildren: true };

  currentSort: string[] = [];
  currentFilter: Filter = this.defaultFilter;

  selection: Member[] = [];
  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;
  @ViewChild('compositionFilter') private compositionFilter?: GroupCompositionFilterComponent;

  private dataFetching = new Subject<{ groupId: string, filter: Filter, sort: string[] }>();

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
  ) {
    this.dataFetching.pipe(
      switchMap(params => this.getData(params.groupId, params.filter, params.sort)),
      mapToFetchState(),
    ).subscribe(
      state => {
        this.state = state.tag;
        if (state.isReady) this.data = state.data;
      },
      _err => {
        this.state = 'error';
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

  getData(groupId: string, filter: Filter, sort: string[]): Observable<Data> {
    switch (filter.type) {
      case 'groups':
        return this.getGroupChildrenService.getGroupChildren(groupId, sort, [], [ 'Team', 'Session', 'User' ])
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children
          })));
      case 'sessions':
        return this.getGroupChildrenService.getGroupChildren(groupId, sort, [ 'Session' ])
          .pipe(map(children => ({
            columns: nameUserCountColumns,
            rowData: children,
          })));
      case 'teams':
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
      case 'users':
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

  onRemove(): void {
    if (this.selection.length === 0 || !this.group) return;

    //TODO Remove users

    this.table?.clear();
    this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
  }
}
