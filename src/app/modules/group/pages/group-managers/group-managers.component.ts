import { Component, Input } from '@angular/core';
import { ManagementAdditions } from '../../helpers/group-management';
import { GroupData } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-managers',
  templateUrl: './group-managers.component.html',
  styleUrls: [ './group-managers.component.scss' ],
})
export class GroupManagersComponent {
  @Input() groupData?: GroupData & { group: GroupData['group'] & ManagementAdditions };
}

