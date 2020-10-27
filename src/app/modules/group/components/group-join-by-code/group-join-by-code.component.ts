import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { MessageService } from 'primeng/api';
import { finalize, tap } from 'rxjs/operators';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';
import { Duration } from '../../../../shared/helpers/duration';
import { Group } from '../../http-services/get-group-by-id.service';
import { CodeAdditions, withCodeAdditions } from '../../helpers/group-code';
import { GroupActionsService } from '../../http-services/group-actions.service';
import { CodeActionsService } from '../../http-services/code-actions.service';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: [ './group-join-by-code.component.scss' ],
  providers: [ MessageService ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class GroupJoinByCodeComponent implements OnChanges {

  @Input() group?: Group
  @Output() refreshRequired = new EventEmitter<void>();

  groupExt?: Group & CodeAdditions; // group extended with code related attributes
  processing = false;

  constructor(
    private messageService: MessageService,
    private groupActionsService: GroupActionsService,
    private codeActionsService: CodeActionsService,
  ) { }

  ngOnChanges() {
    this.groupExt = this.group ? withCodeAdditions(this.group) : undefined;
  }

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
    if (!this.group) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.codeActionsService
      .createNewCode(this.group.id)
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false)
      ).subscribe(
        _result => {
          this.displaySuccess('A new code has been generated');
        },
        _err => {
          this.displayError();
        }
      );
  }

  changeValidity(newDuration: Duration) {
    if (!this.groupExt) return;

    // check valid state
    if (this.groupExt.hasCodeNotSet) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupActionsService
      .updateGroup(this.groupExt.id, { code_lifetime: newDuration.toString(), code_expires_at: null })
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false),
      ).subscribe(
        _result => {
          this.displaySuccess('The validity has been changed');
        },
        _err => {
          this.displayError();
        }
      );
  }

  removeCode() {
    if (!this.group) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.codeActionsService
      .removeCode(this.group.id)
      .pipe(
        tap(() => this.refreshRequired.emit()),
        finalize(() => this.processing = false)
      ).subscribe(
        _result => {
          this.displaySuccess('Users will not be able to join with the former code.');
        },
        _err => {
          this.displayError();
        }
      );
  }

}
