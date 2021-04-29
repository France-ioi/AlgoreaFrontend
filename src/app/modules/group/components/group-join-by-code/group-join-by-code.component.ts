import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Duration } from '../../../../shared/helpers/duration';
import { Group } from '../../http-services/get-group-by-id.service';
import { CodeAdditions, withCodeAdditions } from '../../helpers/group-code';
import { GroupActionsService } from '../../http-services/group-actions.service';
import { CodeActionsService } from '../../http-services/code-actions.service';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: [ './group-join-by-code.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class GroupJoinByCodeComponent implements OnChanges {

  @Input() group?: Group
  @Output() refreshRequired = new EventEmitter<void>();

  groupExt?: Group & CodeAdditions; // group extended with code related attributes
  processing = false;

  constructor(
    private groupActionsService: GroupActionsService,
    private codeActionsService: CodeActionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) { }

  ngOnChanges(): void {
    this.groupExt = this.group ? withCodeAdditions(this.group) : undefined;
  }

  /* events */

  generateNewCode(): void {
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
        _result => this.actionFeedbackService.success($localize`A new code has been generated`),
        _err => this.actionFeedbackService.unexpectedError(),
      );
  }

  changeValidity(newDuration: Duration): void {
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
        _result => this.actionFeedbackService.success($localize`The validity has been changed`),
        _err => this.actionFeedbackService.unexpectedError(),
      );
  }

  removeCode(): void {
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
        _result => this.actionFeedbackService.success($localize`Users will not be able to join with the former code.`),
        _err => this.actionFeedbackService.unexpectedError(),
      );
  }

}
