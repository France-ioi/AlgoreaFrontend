import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
  { field: 'user.login', header: $localize`Name` },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
];

const descendantTeamsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
  { field: 'members', header: $localize`Member(s)` },
];

interface Data {
  columns: Column[],
  rowData: (
    (Member|GroupChild|{ login: string, parentGroups: string }|{ name: string, parentGroups: string, members: string }) &
    { route: RawGroupRoute }
  )[],
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

  selection: Member[] = [];

  data: Data = {
    columns: [],
    rowData: [],
  };

  @ViewChild('table') private table?: Table;
  @ViewChild('compositionFilter') private compositionFilter?: GroupCompositionFilterComponent;

  private dataFetching = new Subject<{ route: GroupRoute, filter: Filter, sort: string[] }>();
  removalInProgress$ = new ReplaySubject<boolean>();

  constructor(
    private getGroupMembersService: GetGroupMembersService,
    private getGroupChildrenService: GetGroupChildrenService,
    private getGroupDescendantsService: GetGroupDescendantsService,
    private groupUsersService: GroupUsersService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
    this.dataFetching.pipe(
      switchMap(params => this.getData(params.route, params.filter, params.sort).pipe(mapToFetchState())),
    ).subscribe({
      next: state => {
        this.state = state.tag;
        if (state.isReady) this.data = state.data;
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
    if (!this.groupData) return;
    this.currentFilter = { ...this.defaultFilter };
    this.currentSort = [];
    this.table?.clear();
    this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort });
  }

  getData(route: GroupRoute, filter: Filter, sort: string[]): Observable<Data> {
    switch (filter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(route.id, sort, [], [ 'Team', 'Session', 'User' ])
          .pipe(map(children => ({
            columns: groupsColumns,
            rowData: children.map(child => ({
              ...child,
              route: groupRoute(child.id, [ ...route.path, route.id ]),
            })),
          })));
      case TypeFilter.Sessions:
        return this.getGroupChildrenService.getGroupChildren(route.id, sort, [ 'Session' ])
          .pipe(map(children => ({
            columns: nameUserCountColumns,
            rowData: children.map(child => ({
              ...child,
              route: groupRoute(child.id, [ ...route.path, route.id ]),
            })),
          })));
      case TypeFilter.Teams:
        if (!filter.directChildren) {
          return this.getGroupDescendantsService.getTeamDescendants(route.id, sort)
            .pipe(map(descendantTeams => ({
              columns: descendantTeamsColumns,
              rowData: descendantTeams.map(descendantTeam => ({
                name: descendantTeam.name,
                parentGroups: descendantTeam.parents.map(parent => parent.name).join(', '),
                members: descendantTeam.members.map(member => member.login).join(', '),
                route: rawGroupRoute(descendantTeam.id),
              })),
            })));
        } else {
          return this.getGroupChildrenService.getGroupChildren(route.id, sort, [ 'Team' ])
            .pipe(map(children => ({
              columns: nameUserCountColumns,
              rowData: children.map(child => ({
                ...child,
                route: groupRoute(child.id, [ ...route.path, route.id ]),
              })),
            })));
        }
      case TypeFilter.Users:
        if (filter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(route.id, sort)
            .pipe(
              map(members => ({
                columns: usersColumns,
                rowData: members.map(member => ({
                  ...member,
                  route: groupRoute(member.id, [ ...route.path, route.id ])
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
                route: rawGroupRoute(descendantUser.id),
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
    if (this.currentFilter.type !== TypeFilter.Users) return;

    if (this.selection.length === this.data.rowData.length) {
      this.selection = [];
    } else {
      this.selection = this.data.rowData as Member[];
    }
  }

  onRemove(): void {
    if (this.selection.length === 0 || !this.groupData) return;

    this.removalInProgress$.next(true);
    this.groupUsersService.removeUsers(this.groupData.group.id, this.selection.map(member => member.id))
      .subscribe({
        next: result => {
          displayResponseToast(this.actionFeedbackService, parseResults(result));
          this.table?.clear();
          this.selection = [];
          if (this.groupData) {
            this.dataFetching.next({ route: this.groupData.route, filter: this.currentFilter, sort: this.currentSort });
          }
          this.removalInProgress$.next(false);
        },
        error: _err => {
          this.removalInProgress$.next(false);
          this.actionFeedbackService.unexpectedError();
        }
      });
  }
}
