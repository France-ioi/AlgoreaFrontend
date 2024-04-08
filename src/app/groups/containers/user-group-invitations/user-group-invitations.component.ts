import { Component, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { PendingRequestComponent } from '../pending-request/pending-request.component';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { ProcessGroupInvitationService } from '../../data-access/process-group-invitation.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { UserCaptionPipe } from '../../../pipes/userCaption';
import { SortEvent } from 'primeng/api/sortevent';
import { mapToFetchState } from '../../../utils/operators/state';
import {
  JoinGroupConfirmEvent,
  JoinGroupConfirmationDialogParams,
  JoinGroupConfirmationDialogComponent,
} from '../join-group-confirmation-dialog/join-group-confirmation-dialog.component';

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
    ButtonModule,
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
  ],
})
export class UserGroupInvitationsComponent implements OnDestroy {
  processing = false;
  joinGroupConfirmationDialog?: JoinGroupConfirmationDialogParams;

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

  openJoinGroupConfirmationDialog(pendingRequest: PendingRequest): void {
    this.joinGroupConfirmationDialog = {
      id: pendingRequest.group.id,
      name: pendingRequest.group.name,
      requireLockMembershipApprovalUntil: null,
      requirePersonalInfoAccessApproval: 'none',
      requireWatchApproval: false,
    };
  }

  closeModal(): void {
    this.joinGroupConfirmationDialog = undefined;
  }

  accept(confirmEvent: JoinGroupConfirmEvent): void {
    this.closeModal();
    this.processing = true;
    this.processGroupInvitationService.accept(confirmEvent.id, confirmEvent.approvals).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error($localize`Unable to accept invitation to group "${ confirmEvent.name }"`);
          return;
        }
        this.actionFeedbackService.success($localize`The ${ confirmEvent.name } group has been accepted`);
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

  onReject(pendingRequest: PendingRequest): void {
    this.processing = true;
    this.processGroupInvitationService.reject(pendingRequest.group.id).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error($localize`Unable to reject invitation to group "${ pendingRequest.group.name }"`);
          return;
        }
        this.actionFeedbackService.success($localize`The ${ pendingRequest.group.name } group has been declined`);
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
