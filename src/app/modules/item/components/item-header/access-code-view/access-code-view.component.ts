import { Component, Input } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { InvalidCodeReason, JoinByCodeService } from '../../../../../shared/http-services/join-by-code.service';
import { ItemData } from '../../../services/item-datasource.service';

@Component({
  selector: 'alg-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: [ './access-code-view.component.scss' ]
})
export class AccessCodeViewComponent {

  @Input() itemData?: ItemData;

  state: 'ready'|'loading' = 'ready';

  constructor(
    private joinByCodeService: JoinByCodeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) { }

  onClickAccess(groupCode: string): void {
    this.state = 'loading';

    this.joinByCodeService.checkCodeValidity(groupCode).subscribe(response => {
      this.state = 'ready';
      if (!response.valid) {
        this.errorToast(this.invalidCodeReasonToString(response.reason));
        return;
      }
      if (!this.itemData) return;
      let message = $localize`Are you sure you want to join the group "${response.group.name}"?`;
      const id = this.itemData.item.type === 'Skill' ? response.group.rootSkillId : response.group.rootActivityId;
      if (this.itemData.item.id !== id) {
        message = $localize`The code does not correspond to the group attached to this page. Are you sure you want to join the group "
          ${response.group.name}"?`;
      }

      this.confirmationService.confirm({
        header: $localize`Join the group "${response.group.name}"`,
        message: message,
        acceptLabel: $localize`Join`,
        acceptIcon: 'fa fa-check',
        rejectLabel: $localize`Cancel`,
        accept: () => {
          this.joinGroup(groupCode);
        }
      });
    });
  }

  joinGroup(code: string): void {
    this.joinByCodeService.joinGroupThroughCode(code).subscribe(
      _result => this.successToast(),
      _err => this.errorToast()
    );
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

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: $localize`Error`,
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  successToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: $localize`Success`,
      detail: $localize`Changes successfully saved.`,
      life: TOAST_LENGTH,
    });
  }
}
