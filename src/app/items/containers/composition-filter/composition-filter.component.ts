import { Component, input, linkedSignal, output } from '@angular/core';
import { ensureDefined } from 'src/app/utils/assert';
import { TypeFilter } from '../../models/composition-filter';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';

@Component({
  selector: 'alg-composition-filter',
  templateUrl: './composition-filter.component.html',
  styleUrl: './composition-filter.component.scss',
  imports: [ SelectionComponent ]
})
export class CompositionFilterComponent {
  defaultValue = input.required<TypeFilter>();

  change = output<TypeFilter>();

  // 'Teams' remains in the shared TypeFilter type and data layer; it is omitted here on purpose (Option A).
  readonly typeFilters: {icon:string, label:string, value:TypeFilter}[] = [
    {
      icon: 'ph-duotone ph-users',
      label: $localize`sub-groups`,
      value: 'Groups'
    },
    {
      icon: 'ph-duotone ph-users',
      label: $localize`users`,
      value: 'Users'
    },
  ];

  selectedTypeFilter = linkedSignal({
    source: this.defaultValue,
    computation: defaultValue => {
      const index = this.typeFilters.findIndex(filter => filter.value === defaultValue);
      return index >= 0 ? index : 0;
    },
  });

  onTypeFilterChanged(index: number): void {
    this.change.emit(ensureDefined(this.typeFilters[index]).value);
    this.selectedTypeFilter.set(index);
  }
}
