import { Component, Input } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { DropdownOption } from 'src/app/modules/shared-components/components/dropdown/dropdown.component';
import { Item } from '../../http-services/get-item-by-id.service';

const MIN_MAX_ALLOW_RANGE_HOURS = 1;
const MIN_MAX_ALLOW_RANGE_MS = MIN_MAX_ALLOW_RANGE_HOURS * 3600 * 1000;

function getAllowedTimeMaxDate(timeMinDate: Date): Date {
  return new Date(timeMinDate.getTime() + MIN_MAX_ALLOW_RANGE_MS);
}

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: [ './item-edit-advanced-parameters.component.scss' ]
})
export class ItemEditAdvancedParametersComponent {
  @Input() item?: Item;
  @Input() parentForm?: FormGroup;

  validationCritireaOptions: DropdownOption[] = [{
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
  }]

  minEnteringTimeMaxDate = new Date();

  constructor() { }

  onDurationOnChange(event: boolean): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.parentForm?.get('duration')?.setValidators(event ? Validators.required : null);
    this.parentForm?.get('duration')?.updateValueAndValidity();
  }

  onEnteringTimeMaxOnChange(event: boolean): void {
    if (!event) {
      return;
    }

    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as string;
    const enteringTimeMinDate = new Date(enteringTimeMin);
    this.parentForm?.get('entering_time_max')?.patchValue(
      getAllowedTimeMaxDate(enteringTimeMinDate)
    );
  }

  onDateChange(): void {
    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as string;
    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as string;
    const enteringTimeMinDate = new Date(enteringTimeMin);
    const enteringTimeMaxDate = new Date(enteringTimeMax);

    this.minEnteringTimeMaxDate = enteringTimeMinDate;

    if (enteringTimeMinDate.getTime() > enteringTimeMaxDate.getTime()) {
      this.parentForm?.get('entering_time_max')?.patchValue(enteringTimeMinDate);
    }
  }

}
