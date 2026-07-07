import { Component, input } from '@angular/core';
import { Group } from '../../models/group';
import { GroupInviteUsersComponent } from '../group-invite-users/group-invite-users.component';

@Component({
  selector: 'alg-group-invitations',
  templateUrl: './group-invitations.component.html',
  styleUrl: './group-invitations.component.scss',
  imports: [
    GroupInviteUsersComponent,
  ],
})
export class GroupInvitationsComponent {
  group = input.required<Group>();
}
