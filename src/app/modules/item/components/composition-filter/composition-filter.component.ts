import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export type TypeFilter = 'Groups'|'Teams'|'Users';

@Component({
  selector: 'alg-composition-filter',
  templateUrl: './composition-filter.component.html',
  styleUrls: [ './composition-filter.component.scss' ]
})
export class CompositionFilterComponent implements OnInit {

  @Input() defaultValue?: TypeFilter;

  @Output() change = new EventEmitter<TypeFilter>();

  selectedTypeFilter = 0;

  readonly typeFilters: {icon:string, label:string, value:TypeFilter}[] = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups',
      value: 'Groups'
    },
    {
      icon: 'fa fa-users',
      label: 'teams',
      value: 'Teams'
    },
    {
      icon: 'fa fa-user',
      label: 'users',
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
    if (index < 0 || index >= this.typeFilters.length) throw Error('invalid value for type filter');
    this.selectedTypeFilter = index;
    this.change.emit(this.typeFilters[index].value);
  }

}
