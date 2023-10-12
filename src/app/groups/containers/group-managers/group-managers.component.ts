import { Component, Input } from '@angular/core';
import { ManagementAdditions } from '../../models/group-management';
import { GroupData } from '../../services/group-datasource.service';
import { GroupManagerListComponent } from '../group-manager-list/group-manager-list.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-group-managers',
  templateUrl: './group-managers.component.html',
  styleUrls: [ './group-managers.component.scss' ],
  standalone: true,
  imports: [ NgIf, GroupManagerListComponent ],
})
export class GroupManagersComponent {
  @Input() groupData?: GroupData & { group: GroupData['group'] & ManagementAdditions };
}

