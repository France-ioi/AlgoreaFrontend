import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DropdownOption } from 'src/app/modules/shared-components/components/dropdown/dropdown.component';
import { Item } from '../../http-services/get-item-by-id.service';

const MIN_MAX_ALLOW_RANGE_HOURS = 1;
const MIN_MAX_ALLOW_RANGE_MS = MIN_MAX_ALLOW_RANGE_HOURS * 3600 * 1000;

function getAllowedTimeMaxDate(timeMinDate: Date): Date {
  return new Date(+timeMinDate + MIN_MAX_ALLOW_RANGE_MS);
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

  onRrequiresExplicitEntryChange(): void {
    const nowDate = new Date();
    this.parentForm?.get('entering_time_min')?.patchValue(nowDate);
    this.parentForm?.get('entering_time_max')?.patchValue(
      getAllowedTimeMaxDate(nowDate)
    );
  }

  onDateChange(): void {
    const enteringTimeMin = this.parentForm?.get('entering_time_min')?.value as string;
    const enteringTimeMax = this.parentForm?.get('entering_time_max')?.value as string;
    const enteringTimeMinDate = new Date(enteringTimeMin);
    const enteringTimeMaxDate = new Date(enteringTimeMax);
    const allowForTimeMaxDate = getAllowedTimeMaxDate(enteringTimeMinDate);

    this.minEnteringTimeMaxDate = allowForTimeMaxDate;

    if (+enteringTimeMinDate > (+enteringTimeMaxDate - MIN_MAX_ALLOW_RANGE_MS)) {
      this.parentForm?.get('entering_time_max')?.patchValue(allowForTimeMaxDate);
    }
  }

}
