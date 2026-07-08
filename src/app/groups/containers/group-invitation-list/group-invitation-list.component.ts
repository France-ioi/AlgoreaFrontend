import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { Group } from '../../models/group';
import {
  GroupPendingRequest,
  InvitationAction,
  invitationActions,
  isPendingInvitation,
  parseGroupPendingRequests,
} from '../../models/group-pending-request';
import { APPCONFIG } from 'src/app/config';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';

/** Hide rejections older than this many weeks; pending invitations are always included. */
const REJECTIONS_WINDOW_WEEKS = 4;

@Component({
  selector: 'alg-group-invitation-list',
  templateUrl: './group-invitation-list.component.html',
  imports: [
    LoadingComponent,
    ErrorComponent,
    RelativeTimeComponent,
    UserCaptionPipe,
    RouterLink,
    GroupLinkPipe,
  ],
})
export class GroupInvitationListComponent {
  private config = inject(APPCONFIG);

  group = input.required<Group>();
  refreshTrigger = input(0);

  protected requestsResource = httpResource<GroupPendingRequest[]>(() => {
    this.refreshTrigger();
    return {
      url: `${this.config.apiUrl}/groups/${this.group().id}/requests`,
      params: { rejections_within_weeks: REJECTIONS_WINDOW_WEEKS },
    };
  }, { parse: parseGroupPendingRequests });

  protected invitations = computed(() => {
    const requests = this.requestsResource.value();
    if (!requests) return [];
    return requests.filter(isPendingInvitation);
  });

  protected onRefresh(): void {
    this.requestsResource.reload();
  }

  protected invitationStatus(action: InvitationAction): string {
    switch (action) {
      case invitationActions.invitation_created:
        return $localize`Pending`;
      case invitationActions.invitation_refused:
        return $localize`Rejected`;
    }
  }
}
