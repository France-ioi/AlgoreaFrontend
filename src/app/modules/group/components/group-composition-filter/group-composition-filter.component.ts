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

  onTypePolicyChanged(index: number): void {
    if (index < 0 || index > 3) throw Error('invalid value for category policy');
    this.value.type = index;
    this.change.emit(this.value);
  }
}
