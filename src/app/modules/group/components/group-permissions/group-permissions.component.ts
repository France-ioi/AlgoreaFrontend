import { Component, Input } from '@angular/core';
import { GroupPermissions } from '../../http-services/granted-permissions.service';

@Component({
  selector: 'alg-group-permissions',
  templateUrl: './group-permissions.component.html',
  styleUrls: [ './group-permissions.component.scss' ],
})
export class GroupPermissionsComponent {
  @Input() permissions?: GroupPermissions;
}
