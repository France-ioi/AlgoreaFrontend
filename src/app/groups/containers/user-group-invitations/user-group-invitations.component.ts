import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetRequestsService, GroupInvitation } from '../../data-access/get-requests.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PendingRequestComponent } from '../pending-request/pending-request.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ProcessGroupInvitationService } from '../../data-access/process-group-invitation.service';
import { TableModule } from 'primeng/table';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { SortEvent } from 'primeng/api/sortevent';
import { mapToFetchState } from 'src/app/utils/operators/state';
import {
  JoinGroupConfirmationDialogComponent,
} from '../join-group-confirmation-dialog/join-group-confirmation-dialog.component';
import { GroupApprovals, mapGroupApprovalParamsToValues } from 'src/app/groups/models/group-approvals';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-user-group-invitations',
  templateUrl: './user-group-invitations.component.html',
  styleUrls: [ './user-group-invitations.component.scss' ],
  standalone: true,
  imports: [
    PendingRequestComponent,
    LoadingComponent,
    NgIf,
    ErrorComponent,
    DatePipe,
    NgForOf,
    NgSwitchCase,
    TableModule,
    UserCaptionPipe,
    NgSwitch,
    NgSwitchDefault,
    AsyncPipe,
    NgClass,
    JoinGroupConfirmationDialogComponent,
    ButtonIconComponent,
  ],
})
export class UserGroupInvitationsComponent implements OnDestroy {
  @Output() groupJoined = new EventEmitter<void>();

  processing = false;
  pendingJoinRequest?: {
    id: string,
    name: string,
    params: GroupApprovals,
  };

  private sortSubject = new BehaviorSubject<string[]>([]);
  state$ = this.sortSubject.pipe(
    switchMap(sort =>
      this.getRequestsService.getGroupInvitations(sort).pipe(
        mapToFetchState(),
      )
    )
  );

  constructor(
    private getRequestsService: GetRequestsService,
    private actionFeedbackService: ActionFeedbackService,
    private currentContentService: CurrentContentService,
    private processGroupInvitationService: ProcessGroupInvitationService,
  ) {}

  ngOnDestroy(): void {
    this.sortSubject.complete();
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.sortSubject.value)) {
      this.sortSubject.next(sort);
    }
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));
    if (sortMeta) this.onFetch(sortMeta);
  }

  openJoinGroupConfirmationDialog(groupInvitation: GroupInvitation): void {
    this.pendingJoinRequest = {
      id: groupInvitation.group.id,
      name: groupInvitation.group.name,
      params: {
        requireLockMembershipApprovalUntil: groupInvitation.group.requireLockMembershipApprovalUntil,
        requirePersonalInfoAccessApproval: groupInvitation.group.requirePersonalInfoAccessApproval,
        requireWatchApproval: groupInvitation.group.requireWatchApproval,
      },
    };
  }

  closeModal(): void {
    this.pendingJoinRequest = undefined;
  }

  accept(groupId: string, groupName: string): void {
    if (this.pendingJoinRequest === undefined) throw new Error('Unexpected: Missed pendingJoinRequest data');
    const approvalValues = mapGroupApprovalParamsToValues(this.pendingJoinRequest.params);
    this.closeModal();
    this.processing = true;
    this.processGroupInvitationService.accept(groupId, approvalValues).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error($localize`Unable to accept invitation to group "${ groupName }"`);
          return;
        }
        this.actionFeedbackService.success($localize`The ${ groupName } group has been accepted`);
        this.sortSubject.next(this.sortSubject.value);
        this.groupJoined.emit();
      },
      error: err => {
        this.processing = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  onReject(groupInvitation: GroupInvitation): void {
    this.processing = true;
    this.processGroupInvitationService.reject(groupInvitation.group.id).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error($localize`Unable to reject invitation to group "${ groupInvitation.group.name }"`);
          return;
        }
        this.actionFeedbackService.success($localize`The ${ groupInvitation.group.name } group has been declined`);
        this.sortSubject.next(this.sortSubject.value);
        this.currentContentService.forceNavMenuReload();
      },
      error: err => {
        this.processing = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }
}
