import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownOption } from 'src/app/modules/shared-components/components/dropdown/dropdown.component';
import { Item } from '../../http-services/get-item-by-id.service';
import { HOURS } from 'src/app/shared/helpers/duration';
import { ItemRemoveButtonComponent } from '../../components/item-remove-button/item-remove-button.component';
import { FormErrorComponent } from '../../../shared-components/components/form-error/form-error.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DurationComponent } from '../../../shared-components/components/duration/duration.component';
import { SelectionComponent } from '../../../shared-components/components/selection/selection.component';
import { DropdownComponent } from '../../../shared-components/components/dropdown/dropdown.component';
import { SwitchComponent } from '../../../shared-components/components/switch/switch.component';
import { InputComponent } from '../../../shared-components/components/input/input.component';
import { NgIf } from '@angular/common';

export const DEFAULT_ENTERING_TIME_MIN = '1000-01-01T00:00:00Z';
export const DEFAULT_ENTERING_TIME_MAX = '9999-12-31T23:59:59Z';

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: [ './item-edit-advanced-parameters.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    InputComponent,
    SwitchComponent,
    DropdownComponent,
    SelectionComponent,
    DurationComponent,
    CalendarModule,
    InputNumberModule,
    FormErrorComponent,
    ItemRemoveButtonComponent
  ],
})
export class ItemEditAdvancedParametersComponent implements OnInit {
  @Output() confirmRemoval = new EventEmitter<void>();

  @Input() item?: Item;
  @Input() parentForm?: UntypedFormGroup;
  @Input() attemptId?: string;

  validationCriteriaOptions: DropdownOption[] = [{
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

  minAdmittedMembersRatioOptions: DropdownOption[] = [{
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
    if (!enabled) {
      return;
    }

    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as Date;

    if (enteringTimeMin.getTime() === new Date(DEFAULT_ENTERING_TIME_MIN).getTime()) {
      this.parentForm?.get('entering_time_min')?.patchValue(
        new Date()
      );
    }
  }

  onEnteringTimeMaxEnabledChange(enabled: boolean): void {
    if (!enabled) {
      return;
    }

    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as Date;

    if (enteringTimeMax.getTime() === new Date(DEFAULT_ENTERING_TIME_MAX).getTime()) {
      const enteringTimeMinEnabled = this.parentForm?.get('entering_time_min_enabled')?.value as boolean;
      const enteringTimeMin = enteringTimeMinEnabled ? this.parentForm?.get('entering_time_min')?.value as Date : new Date();
      const newTimeMax = enteringTimeMinEnabled ? enteringTimeMin.getTime() + HOURS : enteringTimeMin.getTime();

      this.parentForm?.get('entering_time_max')?.patchValue(
        new Date(newTimeMax)
      );
    }
  }

  onDateChange(): void {
    const enteringTimeMinEnabled = this.parentForm?.get('entering_time_min_enabled')?.value as boolean;
    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as Date;
    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as Date;

    this.minEnteringTimeMaxDate = enteringTimeMinEnabled ?
      new Date(Math.min(enteringTimeMin.getTime(), enteringTimeMax.getTime())) : new Date();
  }

  onConfirmRemoval(): void {
    this.confirmRemoval.emit();
  }

}
