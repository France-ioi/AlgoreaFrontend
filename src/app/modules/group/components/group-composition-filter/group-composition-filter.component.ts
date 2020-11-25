import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export enum TypeFilter {
  Groups,
  Sessions,
  Teams,
  Users,
}

export interface Filter {
  directChildren: boolean,
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

  value: Filter = { type: TypeFilter.Users, directChildren: true };

  selectedChildrenFilter = 0;
  selectedTypeFilter = 0;

  readonly childrenFilters: { label:string, value: boolean }[] = [
    {
      label: 'Direct Children Only',
      value: true,
    },
    {
      label: 'All Descendants',
      value: false,
    },
  ];

  readonly allDescendantsTypeFilters = [
    {
      icon: 'fa fa-users',
      label: 'teams',
      value: TypeFilter.Teams
    },
    {
      icon: 'fa fa-user',
      label: 'users',
      value: TypeFilter.Users
    },
  ];

  readonly directChildrenTypeFilters = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups',
      value: TypeFilter.Groups
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions',
      value: TypeFilter.Sessions
    },
    {
      icon: 'fa fa-users',
      label: 'teams',
      value: TypeFilter.Teams
    },
    {
      icon: 'fa fa-user',
      label: 'users',
      value: TypeFilter.Users
    },
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
      this.selectedChildrenFilter = this.childrenFilters.findIndex(childrenFilter => childrenFilter.value === this.value.directChildren);
      const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
      this.selectedTypeFilter = Math.max(0, typeFilters.findIndex(typeFilter => typeFilter.value === this.value.type));
    }
  }

  onTypeFilterChanged(index: number): void {
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    if (index < 0 || index >= typeFilters.length) throw Error('invalid value for type filter');
    this.selectedTypeFilter = index;
    this.value.type = typeFilters[index].value;
    this.change.emit(this.value);
  }

  onChildrenFilterChanged(index: number): void {
    if (index < 0 || index >= this.childrenFilters.length) throw Error('invalid value for children filter');

    this.selectedChildrenFilter = index;
    this.value.directChildren = this.childrenFilters[index].value;

    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = typeFilters.findIndex(typeFilter => typeFilter.value === TypeFilter.Users);
    this.value.type = typeFilters[this.selectedTypeFilter].value;

    this.change.emit(this.value);
  }
}
