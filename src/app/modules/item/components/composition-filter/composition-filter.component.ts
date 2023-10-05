import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ensureDefined } from 'src/app/shared/helpers/assert';
import { TypeFilter } from '../../helpers/composition-filter';
import { SelectionComponent } from '../../../shared-components/components/selection/selection.component';

@Component({
  selector: 'alg-composition-filter',
  templateUrl: './composition-filter.component.html',
  styleUrls: [ './composition-filter.component.scss' ],
  standalone: true,
  imports: [ SelectionComponent ]
})
export class CompositionFilterComponent implements OnInit {

  @Input() defaultValue?: TypeFilter;

  @Output() change = new EventEmitter<TypeFilter>();

  selectedTypeFilter = 0;

  readonly typeFilters: {icon:string, label:string, value:TypeFilter}[] = [
    {
      icon: 'fa fa-users',
      label: $localize`sub-groups`,
      value: 'Groups'
    },
    {
      icon: 'fa fa-users',
      label: $localize`teams`,
      value: 'Teams'
    },
    {
      icon: 'fa fa-user',
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
