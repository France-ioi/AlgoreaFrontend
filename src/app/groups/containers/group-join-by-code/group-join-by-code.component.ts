import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Duration } from 'src/app/utils/duration';
import { Group } from '../../models/group';
import { codeInfo } from '../../models/group-code';
import { GroupActionsService } from '../../data-access/group-actions.service';
import { CodeActionsService } from '../../data-access/code-actions.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { of } from 'rxjs';
import { CodeLifetime } from '../../models/code-lifetime';
import { HttpErrorResponse } from '@angular/common/http';
import { DurationToMinPipe } from 'src/app/pipes/duration';
import { FormsModule } from '@angular/forms';
import { DurationComponent } from 'src/app/ui-components/duration/duration.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { CodeTokenComponent } from 'src/app/ui-components/code-token/code-token.component';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrl: './group-join-by-code.component.scss',
  imports: [
    CodeTokenComponent,
    SelectionComponent,
    DurationComponent,
    FormsModule,
    DecimalPipe,
    DatePipe,
    DurationToMinPipe,
    LoadingComponent,
    ButtonComponent,
    ButtonIconComponent,
    TooltipDirective,
  ]
})
export class GroupJoinByCodeComponent {
  private groupActionsService = inject(GroupActionsService);
  private codeActionsService = inject(CodeActionsService);
  private actionFeedbackService = inject(ActionFeedbackService);

  group = input.required<Group>();
  refreshRequired = output<void>();

  codeInfo = computed(() => codeInfo(this.group()));
  codeLifetimeControlValue?: Duration;
  processing = signal(false);

  codeLifetimeOptions = [
    {
      label: $localize`Infinite`,
      value: 'infinite',
      tooltip: $localize`This code will never expire ` + $localize`:@@resetCurrentExpiration:(reset current expiration)`,
    },
    {
      label: $localize`Usable once`,
      value: 'usable_once',
      tooltip: $localize`This code will be usable only once ` + $localize`:@@resetCurrentExpiration:(reset current expiration)`,
    },
    {
      label: $localize`Custom`,
      value: 'custom',
      tooltip: $localize`:@@expireDuration:This code will expire after the given duration ` +
        $localize`:@@resetCurrentExpiration:(reset current expiration)`,
    },
  ];
  customCodeLifetimeOption = this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  selectedCodeLifetimeOption = signal(0);
  durationTooltip = $localize`:@@expireDuration:This code will expire after the given duration ` +
    $localize`:@@resetCurrentExpiration:(reset current expiration)`;

  // Only reset the user-editable duration controls when the server-side lifetime actually changed,
  // so unrelated group refreshes don't clobber in-progress edits.
  // `null` is included because CodeLifetime.valueInSeconds returns number | null.
  private previousCodeLifetimeSeconds: number | null | undefined;

  constructor() {
    effect(() => {
      const group = this.group();
      const seconds = group.codeLifetime?.valueInSeconds;
      if (seconds !== this.previousCodeLifetimeSeconds) {
        this.previousCodeLifetimeSeconds = seconds;
        this.codeLifetimeControlValue = group.codeLifetime?.asDuration;
        this.selectedCodeLifetimeOption.set(this.getSelectedCodeLifetimeOption(group.codeLifetime));
      }
    });
  }

  /* events */

  generateNewCode(): void {
    // disable UI
    this.processing.set(true);

    const group = this.group();
    const groupId = group.id;
    const expiresAt = group.codeExpiresAt;
    // call code refresh service, then group refresh data
    this.codeActionsService.createNewCode(groupId)
      .pipe(
        switchMap(() =>
        // if a code expiration was defined, reset it to null
          (expiresAt === null ? of(undefined) : this.groupActionsService.updateGroup(groupId, { code_expires_at: null }))
        ),
      )
      .subscribe({
        next: () => {
          this.actionFeedbackService.success($localize`A new code has been generated`);
          this.processing.set(false);
          this.refreshRequired.emit();
        },
        error: err => {
          this.processing.set(false);
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  submitCodeLifetime(ms: number): void {
    const info = this.codeInfo();
    if (info.hasCodeNotSet) throw new Error('cannot submit code lifetime when no code is set');
    const group = this.group();
    const newCodeLifetime = new CodeLifetime(ms);
    if (group.codeLifetime?.valueInSeconds === newCodeLifetime.valueInSeconds) return;

    // disable UI
    this.processing.set(true);

    // call code refresh service, then group refresh data
    this.groupActionsService.updateGroup(group.id, {
      code_lifetime: newCodeLifetime.valueInSeconds,
      code_expires_at: null,
    }).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`The validity has been changed`);
        this.processing.set(false);
        this.refreshRequired.emit();
      },
      error: err => {
        this.processing.set(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  removeCode(): void {
    // disable UI
    this.processing.set(true);

    const group = this.group();
    const groupId = group.id;
    const expiresAt = group.codeExpiresAt;
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
          this.processing.set(false);
          this.refreshRequired.emit();
        },
        error: err => {
          this.processing.set(false);
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  changeCodeLifetime(selected: number): void {
    const optionValue = this.codeLifetimeOptions[selected]?.value;
    if (optionValue === 'infinite') this.submitCodeLifetime(CodeLifetime.infiniteValue);
    if (optionValue === 'usable_once') this.submitCodeLifetime(CodeLifetime.usableOnceValue);

    this.selectedCodeLifetimeOption.set(selected);
  }

  private getSelectedCodeLifetimeOption(codeLifetime?: CodeLifetime): number {
    if (codeLifetime?.isUsableOnce) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'usable_once');
    if (codeLifetime?.isInfinite) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'infinite');
    return this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  }

}
