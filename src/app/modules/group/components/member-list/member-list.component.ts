import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { merge, Observable, of, Subject } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
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
  { field: 'user_count', header: 'User Count' },
];

interface Data {
  columns: Column[],
  rowData: (Member|GroupChild)[],
}

@Component({
  selector: 'alg-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: [ './member-list.component.scss' ]
})
export class MemberListComponent implements OnChanges, OnDestroy {

  @Input() group? : Group;

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  defaultPolicy: Filter = { type: TypeFilter.Groups };

  currentSort: string[] = [];
  currentPolicy: Filter = this.defaultPolicy;

  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;

  private dataFetching = new Subject<{ groupId: string, policy: Filter, sort: string[] }>();

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
    this.currentPolicy = { ...this.defaultPolicy };
    this.currentSort = [];
    this.table?.reset();
    this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: this.currentSort });
  }

  getData(groupId: string, policy: Filter, sort: string[]): Observable<Data> {
    switch (policy.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(groupId, sort)
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children.filter(child => child.type != 'Session' && child.type != 'User' && child.type != 'Team')
          })));
      case TypeFilter.Users:
      default:
        return this.getGroupMembersService.getGroupMembers(groupId, sort)
          .pipe(map(members => ({ columns: usersColumns, rowData: members })));
    }
  }

  onCustomSort(event: SortEvent): void {
    if (!this.group) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: this.currentSort });
    }
  }

  onPolicyChange(policy: Filter): void {
    if (!this.group) return;

    if (policy !== this.currentPolicy) {
      this.currentPolicy = { ...policy };
      this.currentSort = [];
      this.table?.reset();
      this.dataFetching.next({ groupId: this.group.id, policy: this.currentPolicy, sort: this.currentSort });
    }
  }
}
