import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { ManagementAdditions } from '../../helpers/group-management';

@Component({
  selector: 'alg-group-managers',
  templateUrl: './group-managers.component.html',
  styleUrls: [ './group-managers.component.scss' ],
})
export class GroupManagersComponent {
  @Input() group?: Group & ManagementAdditions;
}

