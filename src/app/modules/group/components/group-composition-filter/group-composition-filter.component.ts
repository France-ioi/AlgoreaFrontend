import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export enum CategoryPolicy {
  Groups,
  Sessions,
  Teams,
  Users,
}

export interface Policy {
  category: CategoryPolicy,
}

@Component({
  selector: 'alg-group-composition-filter',
  templateUrl: './group-composition-filter.component.html',
  styleUrls: [ './group-composition-filter.component.scss' ]
})
export class GroupCompositionFilterComponent implements OnInit{

  @Input() defaultValue?: Policy;

  @Output() change = new EventEmitter<Policy>();

  value: Policy = { category: CategoryPolicy.Users };

  categoryPolicies = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups'
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions'
    },
    {
      icon: 'fa fa-users',
      label: 'teams'
    },
    {
      icon: 'fa fa-user',
      label: 'users'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  onCategoryPolicyChanged(index: number): void {
    if (index < 0 || index > 3) throw Error('invalid value for category policy');
    this.value.category = index;
    this.change.emit(this.value);
  }
}
