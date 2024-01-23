import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Duration } from 'src/app/utils/duration';
import { Group } from '../../data-access/get-group-by-id.service';
import { codeInfo, CodeInfo } from '../../models/group-code';
import { GroupActionsService } from '../../data-access/group-actions.service';
import { CodeActionsService } from '../../data-access/code-actions.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { of } from 'rxjs';
import { CodeLifetime } from '../../models/code-lifetime';
import { HttpErrorResponse } from '@angular/common/http';
import { DurationToMinPipe } from 'src/app/pipes/duration';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DurationComponent } from 'src/app/ui-components/duration/duration.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { CodeTokenComponent } from 'src/app/ui-components/code-token/code-token.component';
import { ButtonModule } from 'primeng/button';
import { SectionParagraphComponent } from 'src/app/ui-components/section-paragraph/section-paragraph.component';
import { NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';

@Component({
  selector: 'alg-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: [ './group-join-by-code.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    SectionParagraphComponent,
    ButtonModule,
    CodeTokenComponent,
    SelectionComponent,
    DurationComponent,
    FormsModule,
    TooltipModule,
    DecimalPipe,
    DatePipe,
    DurationToMinPipe,
    LoadingComponent,
  ],
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
  selectedCodeLifetimeOption = 0;
  durationTooltip = $localize`:@@expireDuration:This code will expire after the given duration ` +
    $localize`:@@resetCurrentExpiration:(reset current expiration)`;

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
        this.codeLifetimeControlValue = this.group.codeLifetime?.asDuration;
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
        // if a code expiration was defined, reset it to null
          (expiresAt === null ? of(undefined) : this.groupActionsService.updateGroup(groupId, { code_expires_at: null }))
        ),
      )
      .subscribe({
        next: () => {
          this.actionFeedbackService.success($localize`A new code has been generated`);
          this.processing = false;
          this.refreshRequired.emit();
        },
        error: err => {
          this.processing = false;
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

  submitCodeLifetime(ms: number): void {
    if (!this.group || !this.codeInfo) throw new Error('cannot submit new code lifetime when group is undefined');
    if (this.codeInfo.hasCodeNotSet) throw new Error('cannot submit code lifetime when no code is set');
    const newCodeLifetime = new CodeLifetime(ms);
    if (this.group.codeLifetime?.valueInSeconds === newCodeLifetime.valueInSeconds) return;

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
      error: err => {
        this.processing = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
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
        error: err => {
          this.processing = false;
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
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
    if (codeLifetime?.isUsableOnce) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'usable_once');
    if (codeLifetime?.isInfinite) return this.codeLifetimeOptions.findIndex(({ value }) => value === 'infinite');
    return this.codeLifetimeOptions.findIndex(({ value }) => value === 'custom');
  }

}
