import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NgIf } from '@angular/common';

export interface DropdownOption {
  label: string,
  value: string,
}

@Component({
  selector: 'alg-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: [ './dropdown.component.scss' ],
  standalone: true,
  imports: [ NgIf, DropdownModule, FormsModule, ReactiveFormsModule ]
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
