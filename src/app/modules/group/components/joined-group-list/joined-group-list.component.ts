import { Component, OnDestroy, OnInit } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { JoinedGroup, JoinedGroupsService } from 'src/app/core/http-services/joined-groups.service';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';

@Component({
  selector: 'alg-joined-group-list',
  templateUrl: './joined-group-list.component.html',
  styleUrls: [ './joined-group-list.component.scss' ]
})
export class JoinedGroupListComponent implements OnDestroy, OnInit {

  state: 'error' | 'ready' | 'fetching' = 'fetching';
  currentSort: string[] = [];

  data: JoinedGroup[] = [];

  private dataFetching = new Subject<{ sort: string[] }>();

  constructor(private joinedGroupsService:JoinedGroupsService) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.joinedGroupsService.getJoinedGroups(params.sort).pipe(map(readyState)),
        )
      )
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) this.data = state.data;
      },
      _err => {
        this.state = 'error';
      }
    );
  }

  ngOnInit(): void {
    this.dataFetching.next({ sort: this.currentSort });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ sort: this.currentSort });
    }
  }

}
