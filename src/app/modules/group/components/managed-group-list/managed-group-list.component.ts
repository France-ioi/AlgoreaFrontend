import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
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

  private subscription?: Subscription;

  constructor(private managedGroupService: ManagedGroupsService) {
  }

  ngOnInit(): void {
    this.subscription = this.managedGroupService.getManagedGroups().pipe().subscribe(
      data => {
        this.state = 'ready';
        this.data = data;
      },
      _err => this.state = 'error',
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
