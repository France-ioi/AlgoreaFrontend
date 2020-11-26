import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { merge, Observable, of, Subject } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { GetGroupUserDescendantsService } from 'src/app/shared/http-services/get-group-user-descendants.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';
import { TypeFilter, Filter } from '../group-composition-filter/group-composition-filter.component';

interface Column {
  sortable?: boolean,
  field: string,
  header: string
}

const usersColumns: Column[] = [
  { field: 'user.login', header: 'Name', sortable: true },
  { field: 'member_since', header: 'Member Since', sortable: true },
];

const groupsColumns: Column[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type' },
  { field: 'userCount', header: 'User Count' },
];

const descendantUsersColumns: Column[] = [
  { field: 'login', header: 'Name' },
  { field: 'parentGroups', header: 'Parent group(s)' },
];

interface Data {
  columns: Column[],
  rowData: (Member|GroupChild|{ login: string, parentGroups: string })[],
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

  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;

  private dataFetching = new Subject<{ groupId: string, filter: Filter, sort: string[] }>();

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService,
    private getGroupUserDescendantsService: GetGroupUserDescendantsService,
  ) {
    this.dataFetching.pipe(
      delay(0),
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getData(params.groupId, params.filter, params.sort).pipe(map(readyState))
        ))
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) this.data = state.data;
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
    this.table?.reset();
    this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
  }

  getData(groupId: string, filter: Filter, sort: string[]): Observable<Data> {
    switch (filter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(groupId, sort)
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children.filter(child => child.type != 'Session' && child.type != 'User' && child.type != 'Team')
          })));
      case TypeFilter.Users:
      default:
        if (filter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(groupId, sort)
            .pipe(map(members => ({ columns: usersColumns, rowData: members })));
        } else {
          return this.getGroupUserDescendantsService.getGroupUserDescendants(groupId, sort)
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
      this.table?.reset();
      this.dataFetching.next({ groupId: this.group.id, filter: this.currentFilter, sort: this.currentSort });
    }
  }
}
