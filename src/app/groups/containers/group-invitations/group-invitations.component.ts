import { Component, input, signal } from '@angular/core';
import { Group } from '../../models/group';
import { GroupInviteUsersComponent } from '../group-invite-users/group-invite-users.component';
import { GroupInvitationListComponent } from '../group-invitation-list/group-invitation-list.component';

@Component({
  selector: 'alg-group-invitations',
  templateUrl: './group-invitations.component.html',
  imports: [
    GroupInvitationListComponent,
    GroupInviteUsersComponent,
  ],
})
export class GroupInvitationsComponent {
  group = input.required<Group>();

  protected refreshTrigger = signal(0);

  protected onInvitationsChanged(): void {
    this.refreshTrigger.update(count => count + 1);
  }
}
