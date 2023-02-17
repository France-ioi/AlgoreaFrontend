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

  selectedChildrenFilter = 0;
  selectedTypeFilter = 0;

  readonly childrenFilters: { label:string, value: boolean }[] = [
    {
      label: $localize`Direct Children Only`,
      value: true,
    },
    {
      label: $localize`All Descendants`,
      value: false,
    },
  ];

  readonly allDescendantsTypeFilters: { icon: string, label: string, value: TypeFilter }[] = [
    /*    {
      icon: 'fa fa-users',
      label: $localize`teams`,
      value: TypeFilter.Teams
    },*/
    {
      icon: 'fa fa-user',
      label: $localize`users`,
      value: TypeFilter.Users
    },
  ];

  readonly directChildrenTypeFilters: { icon: string, label: string, value: TypeFilter }[] = [
    {
      icon: 'fa fa-users',
      label: $localize`sub-groups`,
      value: TypeFilter.Groups
    },
    /*    {
      icon: 'fa fa-calendar',
      label: $localize`sessions`,
      value: TypeFilter.Sessions
    },
    {
      icon: 'fa fa-users',
      label: $localize`teams`,
      value: TypeFilter.Teams
    },*/
    {
      icon: 'fa fa-user',
      label: $localize`users`,
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
    this.selectedChildrenFilter = this.childrenFilters.findIndex(childrenFilter => childrenFilter.value === this.value.directChildren);
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = Math.max(0, typeFilters.findIndex(typeFilter => typeFilter.value === this.value.type));
  }

  onTypeFilterChanged(index: number): void {
    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = index;
    this.value.type = ensureDefined(typeFilters[index]).value;
    this.change.emit(this.value);
  }

  onChildrenFilterChanged(index: number): void {
    this.value.directChildren = ensureDefined(this.childrenFilters[index]).value;
    this.selectedChildrenFilter = index;

    const typeFilters = this.value.directChildren ? this.directChildrenTypeFilters : this.allDescendantsTypeFilters;
    this.selectedTypeFilter = typeFilters.findIndex(typeFilter => typeFilter.value ===
      (this.value.type === 'teams' ? 'teams' : 'users'));
    this.value.type = ensureDefined(typeFilters[this.selectedTypeFilter]).value;

    this.change.emit(this.value);
  }
}
