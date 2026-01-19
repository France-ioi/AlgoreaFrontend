import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HOURS } from 'src/app/utils/duration';
import { ItemRemoveButtonComponent } from '../../containers/item-remove-button/item-remove-button.component';
import { FormErrorComponent } from 'src/app/ui-components/form-error/form-error.component';
import { DurationComponent } from 'src/app/ui-components/duration/duration.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { DatePipe } from '@angular/common';
import { ItemData } from '../../models/item-data';
import { InputDateComponent } from 'src/app/ui-components/input-date/input-date.component';
import { SelectComponent } from 'src/app/ui-components/select/select.component';
import { SelectOptionComponent } from 'src/app/ui-components/select/select-option/select-option.component';
import { InputNumberComponent } from 'src/app/ui-components/input-number/input-number.component';
import { SelectOption } from 'src/app/ui-components/select/select-option/selected-option.service';

export const DEFAULT_ENTERING_TIME_MIN = '1000-01-01T00:00:00Z';
export const DEFAULT_ENTERING_TIME_MAX = '9999-12-31T23:59:59Z';

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: [ './item-edit-advanced-parameters.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputComponent,
    SwitchComponent,
    SelectionComponent,
    DurationComponent,
    FormErrorComponent,
    ItemRemoveButtonComponent,
    InputDateComponent,
    DatePipe,
    SelectComponent,
    SelectOptionComponent,
    InputNumberComponent
  ]
})
export class ItemEditAdvancedParametersComponent implements OnInit {
  @Output() confirmRemoval = new EventEmitter<void>();

  @Input({ required: true }) itemData!: ItemData;
  @Input() parentForm?: UntypedFormGroup;
  @Input() attemptId?: string;

  validationCriteriaOptions: SelectOption[] = [{
    label: $localize`Never`,
    value: 'None'
  }, {
    label: $localize`All children validated`,
    value: 'All'
  }, {
    label: $localize`All children but one validated`,
    value: 'AllButOne'
  }, {
    label: $localize`All 'Categories' children validated`,
    value: 'Categories'
  }, {
    label: $localize`One children validated`,
    value: 'One'
  }];

  fullScreenOptions: {label: string, value: string}[] = [{
    label: $localize`No`,
    value: 'forceNo'
  }, {
    label: $localize`Based on type`,
    value: 'default'
  }, {
    label: $localize`Yes mapped`,
    value: 'forceYes'
  }];

  childrenLayoutOptions: {label: string, value: string}[] = [{
    label: $localize`List`,
    value: 'List'
  }, {
    label: $localize`Grid`,
    value: 'Grid'
  }];

  minEnteringTimeMaxDate = new Date();
  currentDate = new Date();

  minAdmittedMembersRatioOptions: SelectOption[] = [{
    label: $localize`All the members must be admitted`,
    value: 'All'
  }, {
    label: $localize`Half of the members must be admitted`,
    value: 'Half'
  }, {
    label: $localize`One of the members must be admitted`,
    value: 'One'
  }, {
    label: $localize`None of the members has to be admitted`,
    value: 'None'
  }];

  constructor() { }

  ngOnInit(): void {
    this.handleDurationValidators();
  }

  onRequiresExplicitEntryChange(): void {
    this.handleDurationValidators();
  }

  onDurationEnabledChange(): void {
    this.handleDurationValidators();
  }

  private handleDurationValidators(): void {
    const requiresExplicitEntryValue = this.parentForm?.get('requires_explicit_entry')?.value as boolean;
    const durationEnabledValue = this.parentForm?.get('duration_enabled')?.value as boolean;
    const enableValidation = requiresExplicitEntryValue && durationEnabledValue;

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.parentForm?.get('duration')?.setValidators(enableValidation ? Validators.required : null);
    this.parentForm?.get('duration')?.updateValueAndValidity();
  }

  onEnteringTimeMinEnabledChange(enabled: boolean): void {
    if (!enabled) return;
    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as Date | null;

    if (enteringTimeMin && enteringTimeMin.getTime() === new Date(DEFAULT_ENTERING_TIME_MIN).getTime()) {
      this.parentForm?.get('entering_time_min')?.patchValue(
        new Date()
      );
    }
  }

  onEnteringTimeMaxEnabledChange(enabled: boolean): void {
    if (!enabled) return;
    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as Date | null;

    if (enteringTimeMax && enteringTimeMax.getTime() === new Date(DEFAULT_ENTERING_TIME_MAX).getTime()) {
      const enteringTimeMinEnabled = this.parentForm?.get('entering_time_min_enabled')?.value as boolean;
      const enteringTimeMin = enteringTimeMinEnabled ? this.parentForm?.get('entering_time_min')?.value as Date | null : new Date();
      const newTimeMax = enteringTimeMin && (enteringTimeMinEnabled ? enteringTimeMin.getTime() + HOURS : enteringTimeMin.getTime());
      if (newTimeMax) {
        this.parentForm?.get('entering_time_max')?.patchValue(
          new Date(newTimeMax)
        );
      }
    }
  }

  onDateChange(): void {
    const enteringTimeMinEnabled = this.parentForm?.get('entering_time_min_enabled')?.value as boolean;
    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as Date | null;
    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as Date | null;
    this.minEnteringTimeMaxDate = enteringTimeMinEnabled && enteringTimeMin && enteringTimeMax ?
      new Date(Math.min(enteringTimeMin.getTime(), enteringTimeMax.getTime())) : new Date();
  }

  onConfirmRemoval(): void {
    this.confirmRemoval.emit();
  }

}
