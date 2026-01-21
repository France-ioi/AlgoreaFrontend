import { Component, OnInit, signal } from '@angular/core';
import { Group, GroupType, ManagedGroupsService } from 'src/app/data-access/managed-groups.service';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgClass } from '@angular/common';
import { GroupManagershipLevel, groupManagershipLevelEnum as l } from '../../models/group-management';
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
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';

@Component({
  selector: 'alg-managed-group-list',
  templateUrl: './managed-group-list.component.html',
  styleUrls: [ './managed-group-list.component.scss' ],
  imports: [
    ErrorComponent,
    RouterLink,
    NgClass,
    CdkTable,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
    CdkColumnDef,
    CdkCell,
    CdkCellDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
    LoadingComponent,
  ]
})
export class ManagedGroupListComponent implements OnInit {

  state: 'error' | 'ready' | 'fetching' = 'fetching';

  data: Group[] = [];

  displayedColumns = signal([ 'name', 'type', 'canManage', 'canWatchMembers', 'canGrantGroupAccess' ]);

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
      case l.memberships:
        return $localize`Memberships`;
      case l.memberships_and_group:
        return $localize`Memberships & Group`;
      default:
        return $localize`None`;
    }
  }

}
