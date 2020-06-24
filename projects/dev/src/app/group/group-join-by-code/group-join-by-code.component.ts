import { Component, OnInit } from '@angular/core';
import { Group, GroupCodeState } from '../../shared/models/group.model';
import { GroupService } from '../../shared/services/api/group.service';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { finalize, concatMap } from 'rxjs/operators';
import { TOAST_LENGTH } from '../../shared/constants/global';
import {  ERROR_MESSAGE } from '../../shared/constants/api';
import { Duration } from 'core';

@Component({
  selector: 'app-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: ['./group-join-by-code.component.scss'],
  providers: [ MessageService ]
})

export class GroupJoinByCodeComponent implements OnInit {

  group = new Group();
  processing = false;

  constructor(
    private groupService: GroupService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.groupService.getLatestGroup().subscribe(group => {
      this.group = group;
    });
  }

  reloadGroupData(): Observable<Group> {
    return this.groupService
      .getGroup(this.group.id);
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
    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupService
      .createNewCode(this.group.id)
      .pipe(
        concatMap(() => this.reloadGroupData()),
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
    if (![GroupCodeState.Unused, GroupCodeState.InUse, GroupCodeState.Expired].includes(this.group.codeState())) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupService
      .updateGroup(this.group.id, { code_lifetime: newDuration.toString(), code_expires_at: null })
      .pipe(
        concatMap(() => this.reloadGroupData()),
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
        concatMap(() => this.reloadGroupData()),
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
