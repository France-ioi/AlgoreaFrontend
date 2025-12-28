import { Component, Input } from '@angular/core';
import { GrantedPermissions } from '../../data-access/granted-permissions.service';
import { GroupPermissionCaptionPipe } from 'src/app/pipes/groupPermissionCaption';
import { NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'alg-group-permissions',
  templateUrl: './group-permissions.component.html',
  styleUrls: [ './group-permissions.component.scss' ],
  imports: [
    NgIf,
    DatePipe,
    GroupPermissionCaptionPipe,
  ]
})
export class GroupPermissionsComponent {
  @Input() permissions?: GrantedPermissions['permissions'];
}
