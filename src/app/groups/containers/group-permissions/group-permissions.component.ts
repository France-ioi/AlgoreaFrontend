import { Component, input } from '@angular/core';
import { GrantedPermissions } from '../../data-access/granted-permissions.service';
import { GroupPermissionCaptionPipe } from 'src/app/pipes/groupPermissionCaption';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'alg-group-permissions',
  templateUrl: './group-permissions.component.html',
  styleUrl: './group-permissions.component.scss',
  imports: [
    DatePipe,
    GroupPermissionCaptionPipe,
  ]
})
export class GroupPermissionsComponent {
  permissions = input.required<GrantedPermissions['permissions']>();
}
