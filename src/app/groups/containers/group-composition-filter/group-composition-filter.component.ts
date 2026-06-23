import { Component, input, OnInit, output, signal } from '@angular/core';
import { ensureDefined } from 'src/app/utils/assert';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';

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
  styleUrl: './group-composition-filter.component.scss',
  imports: [ SelectionComponent, SwitchComponent, FormsModule ]
})
export class GroupCompositionFilterComponent implements OnInit {
  defaultValue = input<Filter>();

  change = output<Filter>();

  value = signal<Filter>({ type: TypeFilter.Users, directChildren: true });

  allowToCheckAllDescendants = signal(false);
  allDescendantsChecked = signal(false);
  selectedTypeFilter = signal(0);

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

  ngOnInit(): void {
    const defaultVal = this.defaultValue();
    if (defaultVal) {
      this.setFilter(defaultVal);
    }
  }

  public setFilter(filter: Filter): void {
    this.value.set(filter);
    this.allDescendantsChecked.set(!this.value().directChildren);
    this.selectedTypeFilter.set(Math.max(0, this.typeFilters.findIndex(typeFilter => typeFilter.value === this.value().type)));
    this.allowToCheckAllDescendants.set(!ensureDefined(this.typeFilters[this.selectedTypeFilter()]).directOnly);
  }

  onTypeFilterChanged(index: number): void {
    this.selectedTypeFilter.set(index);
    this.value.update(current => ({ ...current, type: ensureDefined(this.typeFilters[index]).value }));
    this.allowToCheckAllDescendants.set(!ensureDefined(this.typeFilters[index]).directOnly);
    this.change.emit({ ...this.value() });
  }

  onChildrenFilterChanged(checked: boolean): void {
    this.allDescendantsChecked.set(checked);
    this.value.update(current => ({ ...current, directChildren: !checked }));
    // Re-resolve type index after directChildren changes: some filters only allow direct children,
    // so allowToCheckAllDescendants must be refreshed from the canonical typeFilters entry.
    this.selectedTypeFilter.set(this.typeFilters.findIndex(typeFilter => typeFilter.value === this.value().type));
    this.value.update(current => ({ ...current, type: ensureDefined(this.typeFilters[this.selectedTypeFilter()]).value }));
    this.allowToCheckAllDescendants.set(!ensureDefined(this.typeFilters[this.selectedTypeFilter()]).directOnly);
    this.change.emit({ ...this.value() });
  }
}
