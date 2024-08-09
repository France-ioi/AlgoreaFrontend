import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { InvalidCodeReason, JoinByCodeService } from '../../data-access/join-by-code.service';
import { ItemData } from 'src/app/items/models/item-data';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { SectionParagraphComponent } from '../../ui-components/section-paragraph/section-paragraph.component';
import {
  JoinGroupConfirmationDialogComponent
} from 'src/app/groups/containers/join-group-confirmation-dialog/join-group-confirmation-dialog.component';
import { GroupApprovals, mapGroupApprovalParamsToValues } from 'src/app/groups/models/group-approvals';

@Component({
  selector: 'alg-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: [ './access-code-view.component.scss' ],
  standalone: true,
  imports: [ SectionParagraphComponent, NgClass, FormsModule, ButtonModule, JoinGroupConfirmationDialogComponent ]
})
export class AccessCodeViewComponent {
  @Input() sectionLabel = '';
  @Input() buttonLabel = '';
  @Input() itemData?: ItemData;
  @Output() groupJoined = new EventEmitter<void>();

  code = '';
  state: 'ready'|'loading' = 'ready';
  pendingJoinRequest?: {
    name: string,
    params: GroupApprovals,
  };

  constructor(
    private joinByCodeService: JoinByCodeService,
    private actionFeedbackService: ActionFeedbackService,
  ) { }

  checkCodeValidity(): void {
    this.state = 'loading';

    this.joinByCodeService.checkCodeValidity(this.code).subscribe({
      error: () => {
        this.actionFeedbackService.error($localize`Failed to check code validity, please retry. If the problem persists, contact us.`);
      },
      next: response => {
        this.state = 'ready';

        if (!response.valid) {
          this.actionFeedbackService.error(
            response.reason ? this.invalidCodeReasonToString(response.reason): $localize`The provided code is invalid`
          );
          return;
        }

        if (!response.group) throw new Error('Unexpected: Missed group for valid state');

        this.pendingJoinRequest = {
          name: response.group.name,
          params: response.group,
        };
      },
    });
  }

  closeModal(): void {
    this.pendingJoinRequest = undefined;
  }

  joinGroup(code: string, params: GroupApprovals): void {
    const approvalValues = mapGroupApprovalParamsToValues(params);
    this.closeModal();
    this.state = 'loading';
    this.joinByCodeService.joinGroupThroughCode(code, approvalValues).subscribe({
      next: _result => {
        this.state = 'ready';
        this.code = '';
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
        this.groupJoined.emit();
      },
      error: err => {
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
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
