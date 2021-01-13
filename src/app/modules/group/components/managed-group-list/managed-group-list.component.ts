import { Component, OnDestroy, OnInit } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { Group, ManagedGroupsService, ManageType } from '../../../../core/http-services/managed-groups.service';

@Component({
  selector: 'alg-managed-group-list',
  templateUrl: './managed-group-list.component.html',
  styleUrls: [ './managed-group-list.component.scss' ],
})
export class ManagedGroupListComponent implements OnDestroy, OnInit {

  state: 'error' | 'ready' | 'fetching' = 'fetching';
  currentSort: string[] = [];

  data: Group[] = [];

  private dataFetching = new Subject<{}>();

  constructor(private managedGroupService: ManagedGroupsService) {
    this.dataFetching.pipe(
      switchMap(_ => merge(
        of(fetchingState()),
        this.managedGroupService.getManagedGroups().pipe(map(readyState)),
      )),
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) this.data = state.data;
      },
      _err => this.state = 'error',
    );
  }

  ngOnInit(): void {
    this.dataFetching.next();
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }

  getCanManage(value: ManageType): string {
    if (value === 'memberships') return 'Memberships';
    if (value === 'memberships_and_group') return 'Memberships & Group';
    return 'None';
  }

}
