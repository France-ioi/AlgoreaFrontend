import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Duration } from '../../../../shared/helpers/duration';
import { Group } from '../../http-services/get-group-by-id.service';
import { codeInfo, CodeInfo } from '../../helpers/group-code';
import { GroupActionsService } from '../../http-services/group-actions.service';
import { CodeActionsService } from '../../http-services/code-actions.service';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { of } from 'rxjs';
import { CodeLifetime } from '../../helpers/code-lifetime';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: [ './group-join-by-code.component.scss' ],
})

export class GroupJoinByCodeComponent implements OnChanges {

  @Input() group?: Group;
  @Output() refreshRequired = new EventEmitter<void>();

  codeInfo?: CodeInfo;
  codeLifetimeControlValue?: Duration;
  processing = false;

  codeLifetimeOptions = [
    {
      label: $localize`Infinite`,
      value: 'infinite',
      tooltip: $localize`This code will never expire (reset current expiration)`,
    },
    {
      label: $localize`Usable once`,
      value: 'usable_once',
      tooltip: $localize`This code will be usable only once (reset current expiration)`,
    },
    {
      label: $localize`Custom`,
      value: 'custom',
      tooltip: $localize`This code will expire after the given duration (reset current expiration)`,
    },
  ];
  customCodeLifetimeOption = this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  selectedCodeLifetimeOption = 0;

  constructor(
    private groupActionsService: GroupActionsService,
    private codeActionsService: CodeActionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.group && !this.group) this.codeInfo = undefined;
    if (changes.group && this.group) {
      this.codeInfo = codeInfo(this.group);

      const codeLifetimeHasChanged = (changes.group.previousValue as Group | undefined)?.codeLifetime?.valueInSeconds !==
        (changes.group.currentValue as Group | undefined)?.codeLifetime?.valueInSeconds;

      if (codeLifetimeHasChanged) {
        this.codeLifetimeControlValue = this.group.codeLifetime?.duration;
        this.selectedCodeLifetimeOption = this.getSelectedCodeLifetimeOption(this.group.codeLifetime);
      }
    }
  }

  /* events */

  generateNewCode(): void {
    if (!this.group) return;

    // disable UI
    this.processing = true;

    const groupId = this.group.id;
    const expiresAt = this.group.codeExpiresAt;
    // call code refresh service, then group refresh data
    this.codeActionsService.createNewCode(groupId)
      .pipe(
        switchMap(() =>
          (expiresAt === null ? of(undefined) : this.groupActionsService.updateGroup(groupId, { code_expires_at: null }))
        ),
      )
      .subscribe({
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

  submitCodeLifetime(ms: number): void {
    if (!this.group || !this.codeInfo) throw new Error('cannot submit new code lifetime when group is undefined');
    if (this.codeInfo.hasCodeNotSet) throw new Error('cannot submit code lifetime when no code is set');
    const newCodeLifetime = new CodeLifetime(ms);
    if (this.group.codeLifetime?.valueInSeconds === newCodeLifetime.valueInSeconds) throw new Error('code lifetime has not changed');

    // disable UI
    this.processing = true;

    // call code refresh service, then group refresh data
    this.groupActionsService.updateGroup(this.group.id, {
      code_lifetime: newCodeLifetime.valueInSeconds,
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
    if (!this.group) throw new Error('cannot remove code when group is undefined');

    // disable UI
    this.processing = true;

    const groupId = this.group.id;
    const expiresAt = this.group.codeExpiresAt;
    // call code refresh service, then group refresh data
    this.codeActionsService.removeCode(groupId)
      .pipe(
        switchMap(() =>
          // if a code expiration was defined, reset it to null
          (expiresAt === null ? of(undefined) : this.groupActionsService.updateGroup(groupId, { code_expires_at: null }))
        ),
      )
      .subscribe({
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
    if (optionValue === 'infinite') this.submitCodeLifetime(CodeLifetime.infiniteValue);
    if (optionValue === 'usable_once') this.submitCodeLifetime(CodeLifetime.usableOnceValue);

    this.selectedCodeLifetimeOption = selected;
  }

  private getSelectedCodeLifetimeOption(codeLifetime?: CodeLifetime): number {
    if (codeLifetime?.usableOnce) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'usable_once');
    if (codeLifetime?.infinite) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'infinite');
    return this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  }

}
