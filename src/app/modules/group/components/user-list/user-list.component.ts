import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { merge, Observable, of, Subject } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupChildrenService, GroupChild } from '../../http-services/get-group-children.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';
import { Policy } from '../group-composition-filter/group-composition-filter.component';

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
  { field: 'user_count', header: 'User Count' },
];

interface Data {
  columns: Column[],
  rowData: (Member|GroupChild)[],
}

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnChanges, OnDestroy {

  @Input() group? : Group;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  currentSort: string[] = [];

  currentPolicy: Policy = { category: 'users' };

  json = JSON;

  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;

  private dataFetching = new Subject<{ groupId: string, policy: Policy, sort: string[] }>();

  getData(groupId: string, policy: Policy, sort: string[]): Observable<Data> {
    switch (policy.category) {
      case 'groups':
        return this.getGroupChildrenService.getGroupChildren(groupId, sort)
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children.filter(child => child.type != 'Session' && child.type != 'User' && child.type != 'Team')
          })));
      case 'users':
      default:
        return this.getGroupMembersService.getGroupMembers(groupId, sort)
          .pipe(map(members => ({ columns: usersColumns, rowData: members })));
    }
  }

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService
  ) {
    this.dataFetching.pipe(
      delay(0),
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getData(params.groupId, params.policy, params.sort).pipe(map(readyState))
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
    this.table?.reset();
    this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: this.currentSort });
  }

  onCustomSort(event: SortEvent): void {
    if (!this.group) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: sortMeta });
    }
  }

  onPolicyChange(policy: Policy): void {
    if (!this.group) return;

    if (this.currentPolicy !== policy) {
      this.currentPolicy = policy;
      this.currentSort = [];
      this.table?.reset();
      this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: this.currentSort });
    }
  }
}
