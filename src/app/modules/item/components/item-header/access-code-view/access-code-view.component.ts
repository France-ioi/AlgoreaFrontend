import { Component } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { InvalidCodeReason, JoinByCodeService } from '../../../http-services/join-by-code.service';

@Component({
  selector: 'alg-access-code-view',
  templateUrl: './access-code-view.component.html',
  styleUrls: [ './access-code-view.component.scss' ]
})
export class AccessCodeViewComponent {

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
      this.confirmationService.confirm({
        header: `Join the group "${response.group.name}"`,
        message: `Are you sure you want to join the group "${response.group.name}"?`,
        acceptLabel: 'Join',
        acceptIcon: 'fa fa-check',
        rejectLabel: 'Cancel',
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
        return `You are already a member of this group`;
      case 'conflicting_team_participation':
        return `There is conflicting group participation`;
      case 'frozen_membership':
        return `Your membership is frozen`;
      case 'no_group':
        return `No group corresponds to this code`;
      case 'team_conditions_not_met':
        return `You don't meet the group's join conditions`;
    }
  }

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  successToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Changes successfully saved.',
      life: TOAST_LENGTH,
    });
  }
}
