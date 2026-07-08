import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { WithdrawInvitationsService } from '../../data-access/withdraw-invitations.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
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
    ButtonIconComponent,
    UserCaptionPipe,
    RouterLink,
    GroupLinkPipe,
  ],
})
export class GroupInvitationListComponent {
  private config = inject(APPCONFIG);
  private withdrawInvitationsService = inject(WithdrawInvitationsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private destroyRef = inject(DestroyRef);

  protected withdrawingId = signal<string | null>(null);

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

  protected isPending(action: InvitationAction): boolean {
    return action === invitationActions.invitation_created;
  }

  protected onWithdraw(row: GroupPendingRequest): void {
    if (this.withdrawingId() !== null) return;

    this.withdrawingId.set(row.joiningUser.groupId);

    this.withdrawInvitationsService.withdraw(this.group().id, [ row.joiningUser.groupId ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          const status = result.get(row.joiningUser.groupId);
          if (status === 'success' || status === 'unchanged') {
            this.actionFeedbackService.success($localize`The invitation has been withdrawn.`);
          } else {
            this.actionFeedbackService.error($localize`The invitation could not be withdrawn.`);
          }
          this.requestsResource.reload();
          this.withdrawingId.set(null);
        },
        error: () => {
          this.actionFeedbackService.unexpectedError();
          this.withdrawingId.set(null);
        },
      });
  }
}
