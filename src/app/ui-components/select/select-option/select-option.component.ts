import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface SelectOption {
  label: string,
  value: string,
}

@Component({
  selector: 'alg-select-option',
  templateUrl: './select-option.component.html',
  styleUrls: [ './select-option.component.scss' ],
  imports: [
    NgClass
  ]
})
export class SelectOptionComponent {
  value = input.required<SelectOption>();
  select!: (value: SelectOption) => void;
  selected = false;

  constructor() {
  }
}
