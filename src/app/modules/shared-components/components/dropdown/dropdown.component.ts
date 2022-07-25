import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export interface DropdownOption {
  label: string,
  value: string,
}

@Component({
  selector: 'alg-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: [ './dropdown.component.scss' ]
})
export class DropdownComponent implements OnInit {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = '';
  @Input() parentForm?: UntypedFormGroup;
  @Input() name = '';

  formControl?: UntypedFormControl;

  constructor() {}

  ngOnInit(): void {
    if (this.parentForm && this.parentForm.get(this.name)) {
      this.formControl = this.parentForm.get(this.name) as UntypedFormControl;
    }
  }
}
