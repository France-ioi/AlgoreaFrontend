import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ensureDefined } from 'src/app/utils/assert';
import { TypeFilter } from '../../models/composition-filter';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';

@Component({
  selector: 'alg-composition-filter',
  templateUrl: './composition-filter.component.html',
  styleUrls: [ './composition-filter.component.scss' ],
  imports: [ SelectionComponent ]
})
export class CompositionFilterComponent implements OnInit {

  @Input() defaultValue?: TypeFilter;

  @Output() change = new EventEmitter<TypeFilter>();

  selectedTypeFilter = 0;

  readonly typeFilters: {icon:string, label:string, value:TypeFilter}[] = [
    {
      icon: 'ph-duotone ph-users',
      label: $localize`sub-groups`,
      value: 'Groups'
    },
    {
      icon: 'ph-duotone ph-users',
      label: $localize`teams`,
      value: 'Teams'
    },
    {
      icon: 'ph-duotone ph-users',
      label: $localize`users`,
      value: 'Users'
    },
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) {
      this.selectedTypeFilter = this.typeFilters.findIndex(filter => filter.value === this.defaultValue);
    }
  }

  onTypeFilterChanged(index: number): void {
    this.change.emit(ensureDefined(this.typeFilters[index]).value);
    this.selectedTypeFilter = index;
  }

}
