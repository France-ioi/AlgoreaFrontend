import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ensureDefined } from 'src/app/shared/helpers/assert';

export enum TypeFilter {
  Groups = 'groups',
  Sessions = 'sessions',
  Teams = 'teams',
  Users = 'users',
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

  allDescendantsChecked = false;
  selectedTypeFilter = 0;

  readonly allDescendantsTypeFilters: { label: string, value: TypeFilter }[] = [
    /*    {
      icon: 'fa fa-users',
      label: $localize`teams`,
      value: TypeFilter.Teams
    },*/
    {
      label: $localize`Users`,
      value: TypeFilter.Users
    },
  ];

  readonly directChildrenTypeFilters: { label: string, value: TypeFilter }[] = [
    {
      label: $localize`Sub-groups`,
      value: TypeFilter.Groups
    },
    /*{
      icon: 'fa fa-calendar',
      label: $localize`sessions`,
      value: TypeFilter.Sessions
    },
    {
      label: $localize`Team`,
      value: TypeFilter.Teams
    },*/
    {
      label: $localize`Users`,
      value: TypeFilter.Users
    },
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) {
      this.setFilter(this.defaultValue);
    }
  }

  public setFilter(filter: Filter): void {
    this.value = filter;
    this.allDescendantsChecked = !this.value.directChildren;
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = Math.max(0, typeFilters.findIndex(typeFilter => typeFilter.value === this.value.type));
  }

  onTypeFilterChanged(index: number): void {
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = index;
    this.value.type = ensureDefined(typeFilters[index]).value;
    this.change.emit(this.value);
  }

  onChildrenFilterChanged(checked: boolean): void {
    this.value.directChildren = !checked;
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = typeFilters.findIndex(typeFilter => typeFilter.value ===
      (this.value.directChildren
        ? this.value.type === TypeFilter.Users ? TypeFilter.Users : TypeFilter.Groups
        : TypeFilter.Users)
    );
    this.value.type = ensureDefined(typeFilters[this.selectedTypeFilter]).value;
    this.change.emit(this.value);
  }
}
