import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Duration } from '../../../../shared/helpers/duration';
import { Group } from '../../http-services/get-group-by-id.service';
import { CodeLifetime, codeAdditions, CodeAdditions, isSameCodeLifetime } from '../../helpers/group-code';
import { GroupActionsService } from '../../http-services/group-actions.service';
import { CodeActionsService } from '../../http-services/code-actions.service';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: [ './group-join-by-code.component.scss' ],
})

export class GroupJoinByCodeComponent implements OnChanges {

  @Input() group?: Group;
  @Output() refreshRequired = new EventEmitter<void>();

  codeAdditions?: CodeAdditions;
  initialCodeLifetime?: CodeLifetime;
  codeLifetimeDuration?: Duration;
  processing = false;

  codeLifetimeOptions = [
    { label: $localize`Infinite`, value: 'infinite' },
    { label: $localize`Usable once`, value: 'usable_once' },
    { label: $localize`Custom`, value: 'custom' },
  ];
  customCodeLifetimeOption = this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  selectedCodeLifetimeOption = 0;

  constructor(
    private groupActionsService: GroupActionsService,
    private codeActionsService: CodeActionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.group && this.group) {
      this.codeAdditions = codeAdditions(this.group);

      const codeLifetimeHasChanged = this.initialCodeLifetime === undefined
        || !isSameCodeLifetime(this.initialCodeLifetime, this.group.codeLifetime);

      if (codeLifetimeHasChanged) {
        this.initialCodeLifetime = this.group.codeLifetime;
        this.codeLifetimeDuration = this.group.codeLifetime instanceof Duration
          ? this.group.codeLifetime
          : undefined;
        this.selectedCodeLifetimeOption = this.getSelectedCodeLifetimeOption(this.group.codeLifetime);
      }
    }
  }

  /* events */

  generateNewCode(): void {
    if (!this.group) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.codeActionsService.createNewCode(this.group.id).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`A new code has been generated`);
        this.processing = false;
        this.refreshRequired.emit();
      },
      error: () => {
        this.actionFeedbackService.unexpectedError();
        this.processing = false;
      },
    });
  }

  submitCodeLifetime(newCodeLifetime: CodeLifetime): void {
    if (!this.group || !this.codeAdditions) return;
    if (this.codeAdditions.hasCodeNotSet || isSameCodeLifetime(this.group.codeLifetime, newCodeLifetime)) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupActionsService.updateGroup(this.group.id, {
      code_lifetime: newCodeLifetime instanceof Duration ? newCodeLifetime.seconds() : newCodeLifetime,
      code_expires_at: null,
    }).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`The validity has been changed`);
        this.processing = false;
        this.refreshRequired.emit();
      },
      error: () => {
        this.actionFeedbackService.unexpectedError();
        this.processing = false;
      },
    });
  }

  removeCode(): void {
    if (!this.group) return;

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.codeActionsService.removeCode(this.group.id).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`Users will not be able to join with the former code.`);
        this.processing = false;
        this.refreshRequired.emit();
      },
      error: () => {
        this.actionFeedbackService.unexpectedError();
        this.processing = false;
      },
    });
  }

  changeCodeLifetime(selected: number): void {
    const optionValue = this.codeLifetimeOptions[selected]?.value;
    if (optionValue === 'infinite') this.submitCodeLifetime(null);
    if (optionValue === 'usable_once') this.submitCodeLifetime(new Duration(0));

    this.selectedCodeLifetimeOption = selected;
  }

  private getSelectedCodeLifetimeOption(codeLifetime?: CodeLifetime): number {
    if (codeLifetime instanceof Duration) {
      return codeLifetime.ms === 0
        ? this.codeLifetimeOptions.findIndex(({ value }) => value === 'usable_once')
        : this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
    }

    return this.codeLifetimeOptions.findIndex(({ value }) => value === 'infinite');
  }

}
