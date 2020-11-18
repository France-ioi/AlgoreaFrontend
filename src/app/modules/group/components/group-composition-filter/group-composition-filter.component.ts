import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';


export interface Policy {
  category: 'groups'|'teams'|'users'|'sessions',
}

@Component({
  selector: 'alg-group-composition-filter',
  templateUrl: './group-composition-filter.component.html',
  styleUrls: [ './group-composition-filter.component.scss' ]
})
export class GroupCompositionFilterComponent implements OnInit{

  @Input() defaultValue?: Policy;

  @Output() change = new EventEmitter<Policy>();

  selectedCategoryPolicy = 0;

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
      this.selectedCategoryPolicy = [ 'groups', 'sessions', 'teams', 'users' ].indexOf(this.defaultValue.category);
    }
  }

  onCategoryPolicyChanged(index: number): void {
    this.selectedCategoryPolicy = index;
    this.change.emit({
      category: this.getCategoryPolicy(this.selectedCategoryPolicy),
    });
  }

  getCategoryPolicy(policyIndex: number): 'groups'|'teams'|'users'|'sessions' {
    switch (policyIndex) {
      case 0:
        return 'groups';
      case 1:
        return 'teams';
      case 2:
        return 'users';
      case 3:
        return 'sessions';
      default:
        return 'users';
    }
  }
}
