import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { InvalidCodeReason, JoinByCodeService } from '../../data-access/join-by-code.service';
import { ItemData } from 'src/app/items/models/item-data';
import { FormsModule } from '@angular/forms';
import {
  JoinGroupConfirmationDialogComponent, JoinGroupConfirmationDialogResult
} from 'src/app/groups/containers/join-group-confirmation-dialog/join-group-confirmation-dialog.component';
import { GroupApprovals, mapGroupApprovalParamsToValues } from 'src/app/groups/models/group-approvals';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { catchError, switchMap } from 'rxjs/operators';
import { Dialog } from '@angular/cdk/dialog';
import { EMPTY, Observable, throwError } from 'rxjs';

@Component({
  selector: 'alg-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: [ './access-code-view.component.scss' ],
  standalone: true,
  imports: [ FormsModule, ButtonComponent ]
})
export class AccessCodeViewComponent {
  @Input() sectionLabel = '';
  @Input() buttonLabel = '';
  @Input() itemData?: ItemData;
  @Output() groupJoined = new EventEmitter<void>();

  private dialogService = inject(Dialog);

  code = '';
  state: 'ready'|'loading' = 'ready';

  constructor(
    private joinByCodeService: JoinByCodeService,
    private actionFeedbackService: ActionFeedbackService,
  ) { }

  checkCodeValidity(): void {
    this.state = 'loading';
    this.joinByCodeService.checkCodeValidity(this.code).pipe(
      catchError(() =>
        throwError(() => new Error($localize`Failed to check code validity, please retry. If the problem persists, contact us.`))
      ),
      switchMap(({ valid, group, reason }) => {
        if (!valid) throw new Error(
          reason ? this.invalidCodeReasonToString(reason): $localize`The provided code is invalid`
        );

        if (!group) throw new Error('Unexpected: Missed group for valid state');

        return this.dialogService.open<JoinGroupConfirmationDialogResult>(
          JoinGroupConfirmationDialogComponent,
          {
            data: {
              name: group.name,
              params: group,
            },
            disableClose: true,
          },
        ).closed.pipe(
          switchMap(result => (result?.confirmed ? this.joinGroup(this.code, group) : EMPTY))
        );
      }),
    ).subscribe({
      next: () => {
        this.code = '';
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
        this.groupJoined.emit();
      },
      error: (error: unknown) => {
        this.state = 'ready';
        if (error instanceof Error) {
          this.actionFeedbackService.error(error.message);
        } else if (error instanceof HttpErrorResponse) {
          this.actionFeedbackService.unexpectedError();
        } else {
          throw error;
        }
      },
      complete: () => {
        this.state = 'ready';
      }
    });
  }

  joinGroup(code: string, params: GroupApprovals): Observable<void> {
    return this.joinByCodeService.joinGroupThroughCode(code, mapGroupApprovalParamsToValues(params));
  }

  invalidCodeReasonToString(reason: InvalidCodeReason): string {
    switch (reason) {
      case 'already_member':
        return $localize`You are already a member of this group.`;
      case 'conflicting_team_participation':
        return $localize`You cannot join this team as it would conflict with another team you belong to.`;
      case 'frozen_membership':
        return $localize`This group does not allow any membership change.`;
      case 'no_group':
        return $localize`No group corresponds to this code.`;
      case 'team_conditions_not_met':
        return $localize`You cannot join this team as it would break the entry conditions of content it is participating to.`;
    }
  }

}
