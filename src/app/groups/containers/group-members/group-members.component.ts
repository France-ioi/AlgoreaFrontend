import { Component, input, output } from '@angular/core';
import { GroupData } from '../../models/group-data';
import { MemberListComponent } from '../member-list/member-list.component';
import { GroupNoPermissionComponent } from '../group-no-permission/group-no-permission.component';
import { GroupInviteUsersComponent } from '../group-invite-users/group-invite-users.component';
import { GroupJoinByCodeComponent } from '../group-join-by-code/group-join-by-code.component';

import { IsCurrentUserManagerPipe } from '../../models/group-management';

@Component({
  selector: 'alg-group-members',
  templateUrl: './group-members.component.html',
  styleUrl: './group-members.component.scss',
  imports: [
    MemberListComponent,
    GroupJoinByCodeComponent,
    GroupInviteUsersComponent,
    GroupNoPermissionComponent,
    IsCurrentUserManagerPipe,
  ]
})
export class GroupMembersComponent {
  groupData = input.required<GroupData>();

  groupRefreshRequired = output<void>();
  removedGroup = output<void>();

  refreshGroupInfo(): void {
    this.groupRefreshRequired.emit();
  }
}
