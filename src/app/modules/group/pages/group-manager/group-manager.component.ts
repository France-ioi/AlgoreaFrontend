import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { ManagementAdditions } from '../../helpers/group-management';

@Component({
  selector: 'alg-group-manager',
  templateUrl: './group-manager.component.html',
  styleUrls: [ './group-manager.component.scss' ],
})
export class GroupManagerComponent {
  @Input() group?: Group & ManagementAdditions;
}
