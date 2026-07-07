import { Component, input, output } from '@angular/core';
import { GroupData } from '../../models/group-data';
import { MemberListComponent } from '../member-list/member-list.component';
import { GroupNoPermissionComponent } from '../group-no-permission/group-no-permission.component';
import { GroupInvitationsComponent } from '../group-invitations/group-invitations.component';
import { GroupJoinByCodeComponent } from '../group-join-by-code/group-join-by-code.component';

import { IsCurrentUserManagerPipe } from '../../models/group-management';

@Component({
  selector: 'alg-group-members',
  templateUrl: './group-members.component.html',
  imports: [
    MemberListComponent,
    GroupJoinByCodeComponent,
    GroupInvitationsComponent,
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
