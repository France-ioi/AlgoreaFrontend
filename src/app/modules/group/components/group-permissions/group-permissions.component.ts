import { Component, Input } from '@angular/core';
import { GroupPermissions } from '../../http-services/granted-permissions.service';
import { GroupPermissionCaptionPipe } from '../../../../shared/pipes/groupPermissionCaption';
import { NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'alg-group-permissions',
  templateUrl: './group-permissions.component.html',
  styleUrls: [ './group-permissions.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    GroupPermissionCaptionPipe,
  ],
})
export class GroupPermissionsComponent {
  @Input() permissions?: GroupPermissions;
}
