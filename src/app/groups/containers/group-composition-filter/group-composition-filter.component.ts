import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ensureDefined } from 'src/app/utils/assert';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { NgIf } from '@angular/common';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';

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
  styleUrls: [ './group-composition-filter.component.scss' ],
  imports: [ SelectionComponent, NgIf, SwitchComponent, FormsModule ]
})
export class GroupCompositionFilterComponent implements OnInit{
  @Input() defaultValue?: Filter;

  @Output() change = new EventEmitter<Filter>();

  value: Filter = { type: TypeFilter.Users, directChildren: true };

  allowToCheckAllDescendants = false;
  allDescendantsChecked = false;
  selectedTypeFilter = 0;

  readonly typeFilters: { label: string, value: TypeFilter, directOnly: boolean }[] = [
    {
      label: $localize`Sub-groups`,
      value: TypeFilter.Groups,
      directOnly: true,
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
      value: TypeFilter.Users,
      directOnly: false,
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
    this.selectedTypeFilter = Math.max(0, this.typeFilters.findIndex(typeFilter => typeFilter.value === this.value.type));
    this.allowToCheckAllDescendants = !ensureDefined(this.typeFilters[this.selectedTypeFilter]).directOnly;
  }

  onTypeFilterChanged(index: number): void {
    this.selectedTypeFilter = index;
    this.value.type = ensureDefined(this.typeFilters[index]).value;
    this.allowToCheckAllDescendants = !ensureDefined(this.typeFilters[index]).directOnly;
    this.change.emit(this.value);
  }

  onChildrenFilterChanged(checked: boolean): void {
    this.value.directChildren = !checked;
    this.selectedTypeFilter = this.typeFilters.findIndex(typeFilter => typeFilter.value === this.value.type);
    this.value.type = ensureDefined(this.typeFilters[this.selectedTypeFilter]).value;
    this.allowToCheckAllDescendants = !ensureDefined(this.typeFilters[this.selectedTypeFilter]).directOnly;
    this.change.emit(this.value);
  }
}
