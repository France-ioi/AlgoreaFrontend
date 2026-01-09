import { Component, EventEmitter, inject, OnDestroy, Output, signal } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetRequestsService, GroupInvitation } from '../../data-access/get-requests.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ProcessGroupInvitationService } from '../../data-access/process-group-invitation.service';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { mapToFetchState } from 'src/app/utils/operators/state';
import {
  JoinGroupConfirmationDialogComponent, JoinGroupConfirmationDialogResult,
} from '../join-group-confirmation-dialog/join-group-confirmation-dialog.component';
import { GroupApprovals, mapGroupApprovalParamsToValues } from 'src/app/groups/models/group-approvals';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRow,
  CdkRowDef,
  CdkTable
} from '@angular/cdk/table';
import { TableSortDirective } from 'src/app/ui-components/table-sort/table-sort.directive';
import { SortEvent, TableSortHeaderComponent } from 'src/app/ui-components/table-sort/table-sort-header/table-sort-header.component';
import { Dialog } from '@angular/cdk/dialog';

@Component({
  selector: 'alg-user-group-invitations',
  templateUrl: './user-group-invitations.component.html',
  styleUrls: [ './user-group-invitations.component.scss' ],
  imports: [
    LoadingComponent,
    NgIf,
    ErrorComponent,
    DatePipe,
    NgForOf,
    NgSwitchCase,
    UserCaptionPipe,
    NgSwitch,
    NgSwitchDefault,
    AsyncPipe,
    NgClass,
    ButtonIconComponent,
    CdkTable,
    CdkCell,
    CdkCellDef,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
    TableSortDirective,
    TableSortHeaderComponent,
  ]
})
export class UserGroupInvitationsComponent implements OnDestroy {
  @Output() groupJoined = new EventEmitter<void>();

  private dialogService = inject(Dialog);

  processing = false;

  private sortSubject = new BehaviorSubject<string[]>([]);
  state$ = this.sortSubject.pipe(
    switchMap(sort =>
      this.getRequestsService.getGroupInvitations(sort).pipe(
        mapToFetchState(),
      )
    )
  );

  displayedColumns = signal([ 'name', 'type', 'at', 'operations' ]);

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

  onSortChange(event: SortEvent[]): void {
    const sortMeta = event.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));
    if (sortMeta.length > 0) this.onFetch(sortMeta);
  }

  openJoinGroupConfirmationDialog(groupInvitation: GroupInvitation): void {
    const data = {
      name: groupInvitation.group.name,
      params: {
        requireLockMembershipApprovalUntil: groupInvitation.group.requireLockMembershipApprovalUntil,
        requirePersonalInfoAccessApproval: groupInvitation.group.requirePersonalInfoAccessApproval,
        requireWatchApproval: groupInvitation.group.requireWatchApproval,
      },
    };
    this.dialogService.open<JoinGroupConfirmationDialogResult>(
      JoinGroupConfirmationDialogComponent,
      { data, disableClose: true },
    ).closed.pipe(
      switchMap(response => (response?.confirmed ? this.accept(groupInvitation.group.id, data.params) : EMPTY))
    ).subscribe({
      next: result => {
        this.processing = false;
        if (!result.changed) {
          this.actionFeedbackService.error($localize`Unable to accept invitation to group "${ groupInvitation.group.name }"`);
          return;
        }
        this.actionFeedbackService.success($localize`The ${ groupInvitation.group.name } group has been accepted`);
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

  accept(groupId: string, params: GroupApprovals): Observable<{ changed: boolean }> {
    this.processing = true;
    return this.processGroupInvitationService.accept(groupId, mapGroupApprovalParamsToValues(params));
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
