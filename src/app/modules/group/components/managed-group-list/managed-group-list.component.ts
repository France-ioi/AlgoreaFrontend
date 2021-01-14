import { Component, OnDestroy, OnInit } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { Group, GroupType, ManagedGroupsService, ManageType } from '../../../../core/http-services/managed-groups.service';

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

  getType(value: GroupType): string {
    switch (value) {
      case 'Class':
        return $localize`Class`;
      case 'Base':
        return $localize`Base`;
      case 'Club':
        return $localize`Club`;
      case 'Friends':
        return $localize`Friends`;
      case 'Session':
        return $localize`Session`;
      case 'Team':
        return $localize`Team`;
      default:
        return $localize`Other`;
    }
  }

  getCanManage(value: ManageType): string {
    switch (value) {
      case 'memberships':
        return $localize`Memberships`;
      case 'memberships_and_group':
        return $localize`Memberships & Group`;
      default:
        return $localize`None`;
    }
  }

}
