import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export enum TypeFilter {
  Groups,
  Sessions,
  Teams,
  Users,
}

export interface Filter {
  type: TypeFilter,
}

@Component({
  selector: 'alg-group-composition-filter',
  templateUrl: './group-composition-filter.component.html',
  styleUrls: [ './group-composition-filter.component.scss' ]
})
export class GroupCompositionFilterComponent implements OnInit{

  @Input() defaultValue?: Filter;

  @Output() change = new EventEmitter<Filter>();

  value: Filter = { type: TypeFilter.Users };

  typePolicies = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups',
      type: TypeFilter.Groups
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions',
      type: TypeFilter.Sessions
    },
    {
      icon: 'fa fa-users',
      label: 'teams',
      type: TypeFilter.Teams
    },
    {
      icon: 'fa fa-user',
      label: 'users',
      type: TypeFilter.Users
    }
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  onTypePolicyChanged(index: number): void {
    if (index < 0 || index >= this.typePolicies.length) throw Error('invalid value for category policy');
    this.value.type = this.typePolicies[index].type;
    this.change.emit(this.value);
  }
}
