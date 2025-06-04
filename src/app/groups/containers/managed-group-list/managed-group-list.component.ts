import { Component, OnInit } from '@angular/core';
import { Group, GroupType, ManagedGroupsService } from 'src/app/data-access/managed-groups.service';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, NgClass } from '@angular/common';
import { GroupManagershipLevel } from '../../models/group-management';

@Component({
  selector: 'alg-managed-group-list',
  templateUrl: './managed-group-list.component.html',
  styleUrls: [ './managed-group-list.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ErrorComponent,
    TableModule,
    SharedModule,
    RouterLink,
    NgClass,
  ],
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

  getCanManage(value: GroupManagershipLevel): string {
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
