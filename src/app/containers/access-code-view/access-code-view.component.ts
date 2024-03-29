import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { InvalidCodeReason, JoinByCodeService } from '../../data-access/join-by-code.service';
import { ItemData } from '../../items/services/item-datasource.service';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { SectionParagraphComponent } from '../../ui-components/section-paragraph/section-paragraph.component';

@Component({
  selector: 'alg-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: [ './access-code-view.component.scss' ],
  standalone: true,
  imports: [ SectionParagraphComponent, NgClass, FormsModule, ButtonModule ]
})
export class AccessCodeViewComponent {
  @Input() sectionLabel = '';
  @Input() buttonLabel = '';
  @Input() itemData?: ItemData;
  @Output() groupJoined = new EventEmitter<void>();

  code = '';
  state: 'ready'|'loading' = 'ready';

  constructor(
    private joinByCodeService: JoinByCodeService,
    private actionFeedbackService: ActionFeedbackService,
    private confirmationService: ConfirmationService,
  ) { }

  onClickAccess(): void {
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

        if (!response.group) {
          throw new Error('Unexpected: Missed group for invalid state');
        }

        let message = $localize`Are you sure you want to join the group "${response.group.name}"?`;

        if (this.itemData) {
          const id = this.itemData.item.type === 'Skill' ? response.group.rootSkillId : response.group.rootActivityId;

          if (this.itemData.item.id !== id) {
            message = $localize`The code does not correspond to the group attached to this page. Are you sure you want to join the group "
            ${response.group.name}"?`;
          }
        }

        this.confirmationService.confirm({
          header: $localize`Join the group "${response.group.name}"`,
          message: message,
          acceptLabel: $localize`Join`,
          acceptIcon: 'ph-bold ph-check',
          rejectLabel: $localize`Cancel`,
          rejectIcon: 'ph-bold ph-x',
          accept: () => {
            this.joinGroup(this.code);
          }
        });
      },
    });
  }

  joinGroup(code: string): void {
    this.joinByCodeService.joinGroupThroughCode(code).subscribe({
      next: _result => {
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
