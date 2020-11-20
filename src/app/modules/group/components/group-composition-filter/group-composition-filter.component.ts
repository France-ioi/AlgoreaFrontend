import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export enum TypePolicy {
  Groups,
  Sessions,
  Teams,
  Users,
}

export interface Policy {
  type: TypePolicy,
}

@Component({
  selector: 'alg-group-composition-filter',
  templateUrl: './group-composition-filter.component.html',
  styleUrls: [ './group-composition-filter.component.scss' ]
})
export class GroupCompositionFilterComponent implements OnInit{

  @Input() defaultValue?: Policy;

  @Output() change = new EventEmitter<Policy>();

  value: Policy = { type: TypePolicy.Users };

  typePolicies = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups',
      type: TypePolicy.Groups
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions',
      type: TypePolicy.Sessions
    },
    {
      icon: 'fa fa-users',
      label: 'teams',
      type: TypePolicy.Teams
    },
    {
      icon: 'fa fa-user',
      label: 'users',
      type: TypePolicy.Users
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
