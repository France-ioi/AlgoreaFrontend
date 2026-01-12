import { Component, computed, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { SelectedOptionService, SelectOption } from 'src/app/ui-components/select/select-option/selected-option.service';

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

  selectedOptionService = inject(SelectedOptionService);

  select!: (value: SelectOption) => void;
  selected = computed(() => this.value() === this.selectedOptionService.selected());

  constructor() {
  }
}
