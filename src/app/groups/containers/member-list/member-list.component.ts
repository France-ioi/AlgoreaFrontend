import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { groupRoute, rawGroupRoute, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GetGroupChildrenService, GroupChild } from '../../data-access/get-group-children.service';
import { GetGroupMembersService, GroupMembers } from '../../data-access/get-group-members.service';
import { GroupData } from '../../models/group-data';
import { Filter, GroupCompositionFilterComponent, TypeFilter } from '../group-composition-filter/group-composition-filter.component';
import { FetchState } from 'src/app/utils/state';
import { DataPager } from 'src/app/utils/data-pager';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
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
import { Column, getColumns } from './member-list-columns';
import { MemberListRemovalService } from './member-list-removal.service';

type Member = GroupMembers[number];

const membersLimit = 25;

type Row = (Member|GroupChild|{ login: string, parentGroups: string }|{ name: string, parentGroups: string, members: string }) &
{ route: RawGroupRoute };

@Component({
  selector: 'alg-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: [ './member-list.component.scss' ],
  providers: [ MemberListRemovalService ],
  imports: [
    GroupCompositionFilterComponent,
    ErrorComponent,
    RouterLink,
    AsyncPipe,
    DatePipe,
    GroupLinkPipe,
    UserCaptionPipe,
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
  ]
})
export class MemberListComponent {
  private getGroupMembersService = inject(GetGroupMembersService);
  private getGroupChildrenService = inject(GetGroupChildrenService);
  private getGroupDescendantsService = inject(GetGroupDescendantsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private memberListRemovalService = inject(MemberListRemovalService);
  private destroyRef = inject(DestroyRef);

  groupData = input.required<GroupData>();
  removedGroup = output<void>();

  defaultFilter: Filter = { type: TypeFilter.Users, directChildren: true };

  currentSort = signal<string[]>([]);
  currentFilter = signal<Filter>(this.defaultFilter);
  selection = signal<(Member | GroupChild)[]>([]);

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: Row): Observable<Row[]> => this.getRows(pageSize, latestRow),
    pageSize: membersLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more members, are you connected to the internet?`);
    },
  });
  rows$: Observable<FetchState<Row[]>> = this.datapager.list$;

  private compositionFilter = viewChild<GroupCompositionFilterComponent>('compositionFilter');

  removalInProgress$ = new ReplaySubject<boolean>();

  currentUserCanManage = signal(false);
  columns = signal<Column[]>([]);
  displayedColumns = computed(() => [
    ...(this.currentUserCanManage() ? [ 'checkbox' ] : []),
    ...this.columns().map(column => column.field),
  ]);

  private readonly removalCallbacks = {
    unselectAll: (): void => this.unselectAll(),
    fetchRows: (): void => this.fetchRows(),
    onRemovedGroup: (): void => this.removedGroup.emit(),
  };

  constructor() {
    toObservable(this.groupData).pipe(
      takeUntilDestroyed(),
    ).subscribe(groupData => {
      this.currentFilter.set({ ...this.defaultFilter });
      this.currentUserCanManage.set(groupData.group.currentUserCanManage !== 'none');
      this.columns.set(getColumns(this.currentFilter()));
      this.currentSort.set([]);
      this.fetchRows();
    });

    this.destroyRef.onDestroy(() => {
      this.removalInProgress$.complete();
    });
  }

  fetchRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }

  getRows(pageSize: number, latestRow?: Row): Observable<Row[]> {
    const groupData = this.groupData();
    const route = groupData.route;
    const currentFilter = this.currentFilter();
    const currentSort = this.currentSort();

    switch (currentFilter.type) {
      case TypeFilter.Groups:
        return this.getGroupChildrenService.getGroupChildren(
          route.id,
          currentSort,
          [],
          [ 'Team', 'Session', 'User' ],
        ).pipe(map(children => children.map(child => ({
          ...child,
          route: groupRoute(child, [ ...route.path, route.id ]),
        }))));
      case TypeFilter.Sessions:
        return this.getGroupChildrenService.getGroupChildren(route.id, currentSort, [ 'Session' ])
          .pipe(map(children => children.map(child => ({
            ...child,
            route: groupRoute(child, [ ...route.path, route.id ]),
          }))));
      case TypeFilter.Teams:
        if (!currentFilter.directChildren) {
          return this.getGroupDescendantsService.getTeamDescendants(route.id, { sort: currentSort })
            .pipe(map(descendantTeams => descendantTeams.map(descendantTeam => ({
              id: descendantTeam.id,
              name: descendantTeam.name,
              parentGroups: descendantTeam.parents.map(parent => parent.name).join(', '),
              members: descendantTeam.members.map(member => member.login).join(', '),
              route: rawGroupRoute({ id: descendantTeam.id, isUser: false }),
            }))));
        } else {
          return this.getGroupChildrenService.getGroupChildren(route.id, currentSort, [ 'Team' ])
            .pipe(map(children => children.map(child => ({
              ...child,
              route: groupRoute(child, [ ...route.path, route.id ]),
            }))));
        }
      case TypeFilter.Users:
        if (currentFilter.directChildren) {
          return this.getGroupMembersService.getGroupMembers(
            route.id,
            currentSort,
            pageSize,
            (latestRow as Member|undefined)?.id,
          ).pipe(
            map(members => members.map(member => ({
              ...member,
              route: groupRoute({ id: member.id, isUser: true }, [ ...route.path, route.id ]),
            }))));
        } else {
          return this.getGroupDescendantsService.getUserDescendants(route.id, {
            sort: currentSort,
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
    const sortMeta = events.filter(meta => meta.order !== 0).map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta.length > 0 && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort())) {
      this.currentSort.set(sortMeta);
      this.fetchRows();
    }
  }

  onFilterChange(filter: Filter): void {
    if (filter !== this.currentFilter()) {
      this.currentFilter.set({ ...filter });
      this.columns.set(getColumns(filter));
      this.currentSort.set([]);
      this.fetchRows();
    }
  }

  setFilter(filter: Filter): void {
    this.compositionFilter()?.setFilter(filter);
    this.onFilterChange(filter);
  }

  onSelectAll(rows: Row[]): void {
    if (this.selection().length === rows.length) {
      this.selection.set([]);
    } else {
      this.selection.set(rows as (Member | GroupChild)[]);
    }
  }

  unselectAll(): void {
    this.selection.set([]);
  }

  onSelect(item: (Member | GroupChild)): void {
    const currentSelection = this.selection();
    if (currentSelection.includes(item)) {
      const idx = currentSelection.indexOf(item);
      this.selection.set([
        ...currentSelection.slice(0, idx),
        ...currentSelection.slice(idx + 1),
      ]);
    } else {
      this.selection.set([ ...currentSelection, item ]);
    }
  }

  onRemove(): void {
    const currentSelection = this.selection();
    if (currentSelection.length === 0) throw new Error('Unexpected: Missed group data or selected models');
    const groupId = this.groupData().group.id;
    if (this.currentFilter().type === TypeFilter.Users) {
      this.memberListRemovalService.removeUsers(
        groupId,
        currentSelection as Member[],
        this.removalInProgress$,
        this.removalCallbacks,
      );
    } else {
      this.memberListRemovalService.removeGroupsOrSubgroups(
        currentSelection as GroupChild[],
        groupId,
        this.removalInProgress$,
        this.removalCallbacks,
      );
    }
  }
}
