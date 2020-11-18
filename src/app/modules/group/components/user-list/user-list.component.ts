import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GridComponent } from 'src/app/modules/shared-components/components/grid/grid.component';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupMembersService, Member } from '../../http-services/get-group-members.service';

@Component({
  selector: 'alg-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.scss' ]
})
export class UserListComponent implements OnChanges, OnDestroy {

  @Input() group? : Group;

  state: Ready<Member[]> | Fetching | FetchError = fetchingState();

  currentSort: string[] = [];

  members: Member[] = [];

  @ViewChild('grid') private grid?: GridComponent;

  private dataFetching = new Subject<{groupId: string, sort: string[] }>();

  constructor(private getGroupMembersService: GetGroupMembersService) {
    this.dataFetching.pipe(
      switchMap(options =>
        merge(
          of(fetchingState()),
          this.getGroupMembersService.getGroupMembers(options.groupId, options.sort).pipe(map(readyState))
        ))
    ).subscribe(
      state => {
        this.state = state;
        if (isReady(state)) this.members = state.data;
      },
      _err => {
        this.state = errorState();
      });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.group) return;
    this.dataFetching.next({ groupId: this.group.id, sort: [] });
    this.grid?.reset();
  }

  onCustomSort(event: SortEvent): void {
    if (!this.group) return;

    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ groupId: this.group.id, sort: sortMeta });
    }
  }
}
