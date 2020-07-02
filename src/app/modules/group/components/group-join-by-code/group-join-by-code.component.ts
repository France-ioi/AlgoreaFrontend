import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { GroupService } from '../../../../shared/http-services/group.service';
import { MessageService } from 'primeng/api';
import { finalize, tap } from 'rxjs/operators';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import {  ERROR_MESSAGE } from '../../../../shared/constants/api';
import { Duration } from '../../../../shared/helpers/duration';
import { Group } from '../../http-services/get-group-by-id.service';
import { hasCodeNotSet } from '../../helpers/group-code';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: ['./group-join-by-code.component.scss'],
  providers: [ MessageService ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class GroupJoinByCodeComponent {

  @Input() group: Group
  @Output() refreshRequired = new EventEmitter<void>();

  processing = false;

  constructor(
    private messageService: MessageService,
    private groupService: GroupService
  ) { }

  displaySuccess(msg: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: msg,
      life: TOAST_LENGTH,
    });
  }

  displayError() {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  /* events */

  generateNewCode() {
    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupService
      .createNewCode(this.group.id)
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false)
      ).subscribe(
        (_result) => {
          this.displaySuccess('A new code has been generated');
        },
        (_err) => {
          this.displayError();
        }
      );
  }

  changeValidity(newDuration: Duration) {
    // check valid state
    if (hasCodeNotSet(this.group)) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupService
      .updateGroup(this.group.id, { code_lifetime: newDuration.toString(), code_expires_at: null })
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false),
      ).subscribe(
        (_result) => {
          this.displaySuccess('The validity has been changed');
        },
        (_err) => {
          this.displayError();
        }
      );
  }

  removeCode() {
    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupService
      .removeCode(this.group.id)
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false)
      ).subscribe(
        (_result) => {
          this.displaySuccess('Users will not be able to join with the former code.');
        },
        (_err) => {
          this.displayError();
        }
      );
  }

}
