import { Component, OnInit } from '@angular/core';
import { Group, GroupType, ManagedGroupsService, ManageType } from '../../../../core/http-services/managed-groups.service';

@Component({
  selector: 'alg-managed-group-list',
  templateUrl: './managed-group-list.component.html',
  styleUrls: [ './managed-group-list.component.scss' ],
})
export class ManagedGroupListComponent implements OnInit {

  state: 'error' | 'ready' | 'fetching' = 'fetching';
  currentSort: string[] = [];

  data: Group[] = [];

  constructor(private managedGroupService: ManagedGroupsService) {
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.state = 'fetching';
    this.managedGroupService.getManagedGroups().subscribe({
      next: data => {
        this.state = 'ready';
        this.data = data;
      },
      error: _err => this.state = 'error',
    });
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
